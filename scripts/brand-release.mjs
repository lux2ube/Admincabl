import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

// This release gate mirrors the API and storefront production services from
// their artifact manifests. Override BRAND_API_PORT, BRAND_STORE_PORT,
// BRAND_STORE_BASE_PATH, or CHROMIUM_BIN when a validation runner needs
// isolated ports or a different browser executable.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiPort = Number(process.env.BRAND_API_PORT || "8080");
const storePort = Number(process.env.BRAND_STORE_PORT || "25770");
const storeBasePath = normalizeBasePath(process.env.BRAND_STORE_BASE_PATH || "/cabl-store/");
const apiOrigin = `http://127.0.0.1:${apiPort}`;
const apiUrl = `${apiOrigin}/api`;
const storeUrl = `http://127.0.0.1:${storePort}${storeBasePath}`;
const chromium = process.env.CHROMIUM_BIN || process.env.BRAND_CHROMIUM_BIN;
const children = new Set();

if (!Number.isInteger(apiPort) || apiPort <= 0) {
  throw new Error(`Invalid BRAND_API_PORT value: ${process.env.BRAND_API_PORT || ""}`);
}

if (!Number.isInteger(storePort) || storePort <= 0) {
  throw new Error(`Invalid BRAND_STORE_PORT value: ${process.env.BRAND_STORE_PORT || ""}`);
}

function normalizeBasePath(value) {
  const trimmed = `/${String(value).replace(/^\/+|\/+$/g, "")}`;
  return trimmed === "/" ? "/" : `${trimmed}/`;
}

function commandEnvironment(overrides = {}) {
  return {
    ...process.env,
    NODE_ENV: "production",
    ...overrides,
  };
}

function startProcess(label, args, env = {}) {
  const child = spawn("pnpm", args, {
    cwd: root,
    env: commandEnvironment(env),
    stdio: "inherit",
  });
  child.label = label;
  children.add(child);
  child.once("close", () => children.delete(child));
  return child;
}

async function runCommand(label, args, env = {}) {
  const child = startProcess(label, args, env);
  await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${label} failed${signal ? ` (${signal})` : ` with exit code ${code}`}`));
    });
  });
}

async function waitForHttp(label, url, child, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = "no response";

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`${label} exited with code ${child.exitCode} before becoming ready`);
    }

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`${label} did not become ready at ${url}: ${lastError}`);
}

async function stopProcess(child) {
  if (child.exitCode !== null) return;

  child.kill("SIGTERM");
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
      resolve();
    }, 5_000);
    child.once("close", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function cleanup() {
  await Promise.all([...children].map(stopProcess));
}

try {
  console.log(`Brand release check: API ${apiUrl}, store ${storeUrl}`);
  console.log(`Brand release check: Chromium ${chromium || "workspace default"}`);

  await runCommand("API build", ["--filter", "@workspace/api-server", "run", "build"]);

  const api = startProcess("API server", ["--filter", "@workspace/api-server", "run", "start"], {
    PORT: String(apiPort),
  });
  await waitForHttp("API server", `${apiUrl}/healthz`, api);

  await runCommand("store build", ["--filter", "@workspace/cabl-store", "run", "build"], {
    PORT: String(storePort),
    BASE_PATH: storeBasePath,
    API_PORT: String(apiPort),
    SEO_PRERENDER_API_URL: apiUrl,
    VITE_API_BASE_URL: apiOrigin,
  });

  const store = startProcess("store server", ["--filter", "@workspace/cabl-store", "run", "serve"], {
    PORT: String(storePort),
    BASE_PATH: storeBasePath,
  });
  await waitForHttp("store server", storeUrl, store);

  await runCommand("brand acceptance", ["--filter", "@workspace/scripts", "run", "test:brand"], {
    API_URL: apiUrl,
    STORE_URL: storeUrl,
    ...(chromium ? { CHROMIUM_BIN: chromium } : {}),
  });
} finally {
  await cleanup();
}