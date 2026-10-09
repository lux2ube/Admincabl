import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { Router, type IRouter, type Request, type RequestHandler } from "express";
import {
  CreateAdminSessionBody,
  CreateAdminSessionResponse,
  DeleteAdminSessionResponse,
  GetAdminAuthSessionResponse,
  UpdateAdminCredentialsBody,
  UpdateAdminCredentialsResponse,
} from "@workspace/api-zod";
import { pool } from "@workspace/db";

const router: IRouter = Router();
const cookieName = "cabl_admin_session";
const sessionLifetimeMs = 12 * 60 * 60 * 1000;
const loginWindowMs = 15 * 60 * 1000;
const maxLoginAttempts = 8;
const passwordMinLength = 12;
const passwordMaxLength = 128;
const sessionSecretMinLength = 32;

type AdminCredentials = {
  username: string;
  password_hash: string;
  password_salt: string;
  session_key: string;
  session_version: number;
};

type AdminSessionPayload = {
  exp: number;
  version: number;
};

const normalizeUsername = (username: string) => username.trim().toLowerCase();
const isValidUsername = (username: string) =>
  /^[a-zA-Z0-9._@+-]{3,64}$/.test(username);

function safeErrorContext(error: unknown): { type: string; code?: string } {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : undefined;
  return {
    type: error instanceof Error ? error.name : typeof error,
    ...(code ? { code } : {}),
  };
}

function safeEqual(left: Buffer, right: Buffer): boolean {
  return left.length === right.length && timingSafeEqual(left, right);
}

function constantTimeTextEqual(left: string, right: string): boolean {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return safeEqual(leftDigest, rightDigest) && left.length === right.length;
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < sessionSecretMinLength) {
    throw new Error("SESSION_SECRET is missing or too short");
  }
  return secret;
}

function sessionEncryptionKey(): Buffer {
  return createHash("sha256").update(getSessionSecret()).digest();
}

function encryptSessionKey(sessionKey: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", sessionEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(sessionKey, "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64url");
}

function decryptSessionKey(encryptedSessionKey: string): string {
  const packed = Buffer.from(encryptedSessionKey, "base64url");
  if (packed.length < 29) throw new Error("Invalid encrypted Admin session key");
  const iv = packed.subarray(0, 12);
  const authTag = packed.subarray(12, 28);
  const ciphertext = packed.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", sessionEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

function derivePasswordHash(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      64,
      { N: 16_384, r: 8, p: 1, maxmem: 128 * 1024 * 1024 },
      (error, key) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(key);
      },
    );
  });
}

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await derivePasswordHash(password, salt);
  return {
    passwordSalt: salt.toString("base64url"),
    passwordHash: hash.toString("base64url"),
  };
}

async function verifyPassword(password: string, account: AdminCredentials): Promise<boolean> {
  const salt = Buffer.from(account.password_salt, "base64url");
  const expected = Buffer.from(account.password_hash, "base64url");
  const supplied = await derivePasswordHash(password, salt);
  return safeEqual(supplied, expected);
}

async function getAdminCredentials(): Promise<AdminCredentials | null> {
  const result = await pool.query<AdminCredentials>(
    `SELECT username, password_hash, password_salt, session_key, session_version
     FROM admin_auth_credentials
     WHERE id = 1`,
  );
  return result.rows[0] ?? null;
}

function isSameOriginRequest(req: Request): boolean {
  const origin = req.get("origin");
  const host = req.get("host");
  if (!origin || !host) return false;

  try {
    const parsedOrigin = new URL(origin);
    return (
      parsedOrigin.host.toLowerCase() === host.toLowerCase() &&
      parsedOrigin.protocol === `${req.protocol}:`
    );
  } catch {
    return false;
  }
}

function readCookie(req: Request, name: string): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    const value = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function signSession(payload: AdminSessionPayload, sessionKey: string): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", sessionKey).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function hasValidSession(req: Request, account: AdminCredentials): boolean {
  const token = readCookie(req, cookieName);
  if (!token) return false;

  const [encodedPayload, suppliedSignature, extra] = token.split(".");
  if (!encodedPayload || !suppliedSignature || extra !== undefined) return false;

  const expectedSignature = createHmac("sha256", decryptSessionKey(account.session_key))
    .update(encodedPayload)
    .digest("base64url");
  if (!safeEqual(Buffer.from(suppliedSignature), Buffer.from(expectedSignature))) return false;

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<AdminSessionPayload>;
    return (
      Number.isInteger(payload.exp) &&
      Number.isInteger(payload.version) &&
      (payload.exp as number) > Math.floor(Date.now() / 1000) &&
      payload.version === account.session_version
    );
  } catch {
    return false;
  }
}

function setSessionCookie(
  req: Request,
  res: Parameters<RequestHandler>[1],
  account: AdminCredentials,
): void {
  const token = signSession(
    {
      exp: Math.floor(Date.now() / 1000) + Math.floor(sessionLifetimeMs / 1000),
      version: account.session_version,
    },
    decryptSessionKey(account.session_key),
  );
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: req.secure || process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: sessionLifetimeMs,
  });
}

function clearSessionCookie(
  req: Request,
  res: Parameters<RequestHandler>[1],
): void {
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: req.secure || process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
}

function validatePassword(password: string): string | null {
  if (password.length < passwordMinLength) {
    return "Password must be at least 12 characters.";
  }
  if (password.length > passwordMaxLength) {
    return "Password must be 128 characters or fewer.";
  }
  return null;
}

function bootstrapConfig():
  | { status: "ready"; username: string; password: string }
  | { status: "missing" | "invalid" } {
  const username = process.env.ADMIN_USERNAME?.trim() ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";

  if (!username || !password) return { status: "missing" };
  if (!isValidUsername(username) || validatePassword(password)) {
    return { status: "invalid" };
  }
  return { status: "ready", username: normalizeUsername(username), password };
}

async function createInitialCredentials(
  username: string,
  password: string,
): Promise<AdminCredentials> {
  const { passwordHash, passwordSalt } = await hashPassword(password);
  const sessionKey = randomBytes(32).toString("base64url");
  await pool.query(
    `INSERT INTO admin_auth_credentials
       (id, username, password_hash, password_salt, session_key, session_version)
     VALUES (1, $1, $2, $3, $4, 1)
     ON CONFLICT (id) DO NOTHING`,
    [username, passwordHash, passwordSalt, encryptSessionKey(sessionKey)],
  );

  const account = await getAdminCredentials();
  if (!account) throw new Error("Admin credentials were not created");
  return account;
}

async function recordLoginAttempt(
  req: Request,
  pepper: string,
): Promise<{ attempts: number; windowStartedAt: Date }> {
  const clientAddress = req.ip || req.socket.remoteAddress || "unknown";
  const keyHash = createHmac("sha256", pepper).update(clientAddress).digest("hex");
  await pool.query(
    `DELETE FROM admin_auth_login_attempts
     WHERE window_started_at < now() - interval '24 hours'`,
  );
  const result = await pool.query<{
    attempts: number;
    windowStartedAt: Date;
  }>(
    `INSERT INTO admin_auth_login_attempts (key_hash, window_started_at, attempts)
     VALUES ($1, now(), 1)
     ON CONFLICT (key_hash) DO UPDATE SET
       attempts = CASE
         WHEN admin_auth_login_attempts.window_started_at <= now() - interval '15 minutes' THEN 1
         ELSE admin_auth_login_attempts.attempts + 1
       END,
       window_started_at = CASE
         WHEN admin_auth_login_attempts.window_started_at <= now() - interval '15 minutes' THEN now()
         ELSE admin_auth_login_attempts.window_started_at
       END
     RETURNING attempts, window_started_at AS "windowStartedAt"`,
    [keyHash],
  );
  return result.rows[0];
}

async function clearLoginAttempts(req: Request, pepper: string): Promise<void> {
  const clientAddress = req.ip || req.socket.remoteAddress || "unknown";
  const keyHash = createHmac("sha256", pepper).update(clientAddress).digest("hex");
  await pool.query(
    `DELETE FROM admin_auth_login_attempts WHERE key_hash = $1`,
    [keyHash],
  );
}

function sendUnavailable(res: Parameters<RequestHandler>[1], message: string): void {
  res.setHeader("Cache-Control", "no-store");
  res.status(503).json({ error: message });
}

export const requireAdmin: RequestHandler = (req, res, next) => {
  res.setHeader("Cache-Control", "private, no-store");

  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && !isSameOriginRequest(req)) {
    res.status(403).json({ error: "Request origin is not trusted." });
    return;
  }

  getAdminCredentials()
    .then((account) => {
      if (!account || !hasValidSession(req, account)) {
        clearSessionCookie(req, res);
        res.status(401).json({ error: "Admin sign-in is required." });
        return;
      }
      next();
    })
    .catch((error: unknown) => {
      req.log.error(safeErrorContext(error), "Could not validate Admin session");
      sendUnavailable(res, "Admin authentication is unavailable.");
    });
};

router.get("/admin/auth/session", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const account = await getAdminCredentials();
    if (!account || !hasValidSession(req, account)) {
      res.status(401).json({ error: "Admin sign-in is required." });
      return;
    }
    res.json(GetAdminAuthSessionResponse.parse({
      authenticated: true,
      username: account.username,
    }));
  } catch (error) {
    req.log.error(safeErrorContext(error), "Could not load Admin session");
    sendUnavailable(res, "Admin authentication is unavailable.");
  }
});

router.post("/admin/auth/login", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  if (!isSameOriginRequest(req)) {
    res.status(403).json({ error: "Request origin is not trusted." });
    return;
  }

  const parsed = CreateAdminSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid username and password." });
    return;
  }

  const username = normalizeUsername(parsed.data.username);
  const password = parsed.data.password;
  try {
    let account = await getAdminCredentials();
    const bootstrap = account ? null : bootstrapConfig();
    if (!account && (!bootstrap || bootstrap.status === "missing")) {
      sendUnavailable(res, "Admin credentials are not configured on this deployment.");
      return;
    }
    if (!account && bootstrap?.status === "invalid") {
      sendUnavailable(
        res,
        "The initial Admin credentials are invalid. Use a 3–64 character username with only letters, numbers, ., _, @, +, or -, and a 12–128 character password.",
      );
      return;
    }

    let pepper: string;
    try {
      pepper = getSessionSecret();
    } catch {
      req.log.error(
        { code: "SESSION_SECRET_MISSING_OR_SHORT" },
        "Admin sign-in configuration is invalid",
      );
      sendUnavailable(
        res,
        "Admin session configuration is incomplete. Set SESSION_SECRET to at least 32 characters.",
      );
      return;
    }

    const attempt = await recordLoginAttempt(req, pepper);
    if (attempt.attempts > maxLoginAttempts) {
      const elapsedMs = Date.now() - new Date(attempt.windowStartedAt).getTime();
      const retrySeconds = Math.max(1, Math.ceil((loginWindowMs - elapsedMs) / 1000));
      res.setHeader("Retry-After", String(retrySeconds));
      res.status(429).json({ error: "Too many sign-in attempts. Try again in a few minutes." });
      return;
    }

    let matches = false;
    if (account) {
      const passwordMatches = await verifyPassword(password, account);
      matches = username === account.username && passwordMatches;
    } else if (bootstrap?.status === "ready") {
      const passwordMatches = constantTimeTextEqual(password, bootstrap.password);
      matches = username === bootstrap.username && passwordMatches;
      if (matches) {
        account = await createInitialCredentials(bootstrap.username, bootstrap.password);
        matches =
          account.username === username &&
          (await verifyPassword(password, account));
      }
    }

    if (!account || !matches) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    await clearLoginAttempts(req, pepper);
    setSessionCookie(req, res, account);
    res.json(CreateAdminSessionResponse.parse({
      authenticated: true,
      username: account.username,
    }));
  } catch (error) {
    req.log.error(safeErrorContext(error), "Admin sign-in failed");
    sendUnavailable(res, "Admin authentication is unavailable.");
  }
});

router.post("/admin/auth/logout", (req, res): void => {
  res.setHeader("Cache-Control", "no-store");
  if (!isSameOriginRequest(req)) {
    res.status(403).json({ error: "Request origin is not trusted." });
    return;
  }
  clearSessionCookie(req, res);
  res.json(DeleteAdminSessionResponse.parse({ authenticated: false }));
});

router.post(
  "/admin/auth/credentials",
  requireAdmin,
  async (req, res): Promise<void> => {
    const parsed = UpdateAdminCredentialsBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Enter a valid current password and new credentials." });
      return;
    }

    try {
      const account = await getAdminCredentials();
      if (!account || !(await verifyPassword(parsed.data.currentPassword, account))) {
        res.status(401).json({ error: "Current password is incorrect." });
        return;
      }

      const newUsername = parsed.data.newUsername === undefined
        ? account.username
        : normalizeUsername(parsed.data.newUsername);
      if (!isValidUsername(newUsername)) {
        res.status(400).json({
          error: "Username must be 3–64 characters and use letters, numbers, dots, underscores, @, +, or hyphens.",
        });
        return;
      }

      const newPassword = parsed.data.newPassword;
      if (newPassword !== undefined) {
        const passwordError = validatePassword(newPassword);
        if (passwordError) {
          res.status(400).json({ error: passwordError });
          return;
        }
      }
      if (newUsername === account.username && newPassword === undefined) {
        res.status(400).json({ error: "Enter a new username or password." });
        return;
      }

      const passwordValues = newPassword === undefined
        ? { passwordHash: account.password_hash, passwordSalt: account.password_salt }
        : await hashPassword(newPassword);
      const result = await pool.query<AdminCredentials>(
        `UPDATE admin_auth_credentials
         SET username = $1,
             password_hash = $2,
             password_salt = $3,
             session_version = session_version + 1,
             updated_at = now()
         WHERE id = 1
         RETURNING username, password_hash, password_salt, session_key, session_version`,
        [newUsername, passwordValues.passwordHash, passwordValues.passwordSalt],
      );
      const updatedAccount = result.rows[0];
      if (!updatedAccount) {
        sendUnavailable(res, "Admin credentials are unavailable.");
        return;
      }

      setSessionCookie(req, res, updatedAccount);
      res.json(UpdateAdminCredentialsResponse.parse({
        authenticated: true,
        username: updatedAccount.username,
      }));
    } catch (error) {
      req.log.error(safeErrorContext(error), "Could not update Admin credentials");
      sendUnavailable(res, "Admin credentials could not be updated.");
    }
  },
);

export default router;
