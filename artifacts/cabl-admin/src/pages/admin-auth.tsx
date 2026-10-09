import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, KeyRound, LoaderCircle, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";

type AuthSession = {
  authenticated: true;
  username: string;
};

type AdminAuthState = {
  username: string;
  signOut: () => Promise<void>;
  updateUsername: (username: string) => void;
};

type AdminAuthGateProps = {
  children: (auth: AdminAuthState) => ReactNode;
};

type ApiErrorBody = { error?: unknown };

async function responseError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null) as ApiErrorBody | null;
  return typeof body?.error === "string" ? body.error : fallback;
}

function FullPageMessage({
  title,
  message,
  action,
  busy = false,
}: {
  title: string;
  message: string;
  action?: ReactNode;
  busy?: boolean;
}) {
  return (
    <main className="cabl-noise flex min-h-[100dvh] items-center justify-center p-5">
      <section className="cabl-card w-full max-w-md p-7 text-center sm:p-9">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
          {busy ? <LoaderCircle className="animate-spin" size={23} /> : <ShieldCheck size={23} />}
        </div>
        <p className="mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">CABL / Admin</p>
        <h1 className="mt-3 text-xl font-extrabold">{title}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{message}</p>
        {action && <div className="mt-6">{action}</div>}
      </section>
    </main>
  );
}

export function AdminAuthGate({ children }: AdminAuthGateProps) {
  const queryClient = useQueryClient();
  const wasAuthenticated = useRef(false);
  const [phase, setPhase] = useState<"checking" | "signed-out" | "signed-in" | "unavailable">("checking");
  const [username, setUsername] = useState("");
  const [sessionError, setSessionError] = useState("");

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/auth/session", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (response.status === 401) {
        if (wasAuthenticated.current) queryClient.clear();
        wasAuthenticated.current = false;
        setSessionError("");
        setPhase("signed-out");
        return;
      }
      if (!response.ok) {
        throw new Error(await responseError(response, "Admin authentication is unavailable."));
      }

      const session = await response.json() as AuthSession;
      wasAuthenticated.current = true;
      setUsername(session.username);
      setSessionError("");
      setPhase("signed-in");
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : "Could not verify the Admin session.");
      setPhase("unavailable");
    }
  }, [queryClient]);

  useEffect(() => {
    void refreshSession();
    const timer = window.setInterval(() => void refreshSession(), 5 * 60 * 1000);
    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") void refreshSession();
    };
    document.addEventListener("visibilitychange", refreshOnFocus);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, [refreshSession]);

  const signIn = (nextUsername: string) => {
    queryClient.clear();
    wasAuthenticated.current = true;
    setUsername(nextUsername);
    setSessionError("");
    setPhase("signed-in");
  };

  const signOut = async () => {
    const response = await fetch("/api/admin/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    if (!response.ok) {
      throw new Error(await responseError(response, "Could not sign out. Try again."));
    }
    queryClient.clear();
    wasAuthenticated.current = false;
    setUsername("");
    setPhase("signed-out");
  };

  if (phase === "checking") {
    return <FullPageMessage title="Checking secure access" message="Verifying the Admin session." busy />;
  }
  if (phase === "unavailable") {
    return (
      <FullPageMessage
        title="Admin sign-in is unavailable"
        message={sessionError || "The authentication service could not be reached."}
        action={
          <button
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
            onClick={() => {
              setPhase("checking");
              void refreshSession();
            }}
          >
            Try again
          </button>
        }
      />
    );
  }
  if (phase === "signed-out") {
    return <AdminLoginPage onAuthenticated={signIn} />;
  }

  return children({
    username,
    signOut,
    updateUsername: setUsername,
  });
}

export function AdminLoginPage({
  onAuthenticated,
}: {
  onAuthenticated: (username: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        setError(await responseError(response, "Could not sign in."));
        return;
      }
      const session = await response.json() as AuthSession;
      setPassword("");
      onAuthenticated(session.username);
    } catch {
      setError("Could not reach the Admin service. Check your connection and retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="cabl-noise flex min-h-[100dvh] items-center justify-center px-4 py-10">
      <section className="cabl-card w-full max-w-[430px] overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-secondary" />
        <div className="p-6 sm:p-9">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-sm font-extrabold tracking-[-.08em] text-primary-foreground">CB</span>
            <div>
              <p className="text-sm font-extrabold tracking-[.18em]">CABL</p>
              <p className="mono mt-0.5 text-[10px] uppercase tracking-[.16em] text-muted-foreground">Operations console</p>
            </div>
          </div>

          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
            <LockKeyhole size={21} />
          </div>
          <p className="mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">Restricted access</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Sign in to Admin</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Use the shared administrator login to continue.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold">Username</span>
              <input
                autoComplete="username"
                autoCapitalize="none"
                required
                minLength={3}
                maxLength={64}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="focus-ring min-h-12 w-full rounded-xl border border-input bg-background px-4 text-sm"
                data-testid="input-admin-username"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold">Password</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="focus-ring min-h-12 w-full rounded-xl border border-input bg-background px-4 text-sm"
                data-testid="input-admin-password"
              />
            </label>

            {error && (
              <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs leading-5 text-destructive" data-testid="status-admin-login-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-extrabold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="button-admin-login"
            >
              {busy && <LoaderCircle className="animate-spin" size={17} />}
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="mt-5 text-center text-[11px] leading-5 text-muted-foreground">
            This area is private. Sign out when you finish using a shared device.
          </p>
        </div>
      </section>
    </main>
  );
}

export function AdminAccountSecurityPage({
  username,
  onCredentialsUpdated,
}: {
  username: string;
  onCredentialsUpdated: (username: string) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState(username);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword && newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    if (!newPassword && newUsername.trim().toLowerCase() === username.toLowerCase()) {
      setError("Enter a new username or password.");
      return;
    }

    setBusy(true);
    try {
      const body: Record<string, string> = { currentPassword };
      if (newUsername.trim()) body.newUsername = newUsername.trim();
      if (newPassword) body.newPassword = newPassword;
      const response = await fetch("/api/admin/auth/credentials", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setError(await responseError(response, "Could not update Admin credentials."));
        return;
      }
      const session = await response.json() as AuthSession;
      setNewUsername(session.username);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Credentials updated. Other Admin sessions have been signed out.");
      onCredentialsUpdated(session.username);
    } catch {
      setError("Could not reach the Admin service. Check your connection and retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-enter mx-auto max-w-3xl">
      <Link
        href="/"
        className="focus-ring mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-bold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={15} /> Back to overview
      </Link>

      <div className="mb-6">
        <p className="mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">Admin / account</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Account security</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Change the shared Admin username or password. Your current password is required to save changes.
        </p>
      </div>

      <section className="cabl-card overflow-hidden">
        <div className="flex items-start gap-4 border-b border-border/70 p-5 sm:p-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
            <KeyRound size={19} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold">Shared administrator login</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Signed in as <span className="font-bold text-foreground">{username}</span>
            </p>
          </div>
          <span className="ml-auto hidden rounded-full bg-secondary/70 px-3 py-1 text-[10px] font-bold text-secondary-foreground sm:inline-flex">
            One shared account
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-xs font-bold">
              <UserRound size={14} className="text-muted-foreground" /> New username
            </span>
            <input
              autoComplete="username"
              autoCapitalize="none"
              required
              minLength={3}
              maxLength={64}
              value={newUsername}
              onChange={(event) => setNewUsername(event.target.value)}
              className="focus-ring min-h-12 w-full rounded-xl border border-input bg-background px-4 text-sm"
              data-testid="input-admin-new-username"
            />
            <span className="mt-1.5 block text-[11px] leading-5 text-muted-foreground">3–64 letters, numbers, dots, underscores, @, +, or hyphens.</span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold">New password</span>
              <input
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="focus-ring min-h-12 w-full rounded-xl border border-input bg-background px-4 text-sm"
                data-testid="input-admin-new-password"
              />
              <span className="mt-1.5 block text-[11px] leading-5 text-muted-foreground">Leave blank to keep the current password. New passwords need 12 or more characters.</span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold">Confirm new password</span>
              <input
                type="password"
                autoComplete="new-password"
                maxLength={128}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="focus-ring min-h-12 w-full rounded-xl border border-input bg-background px-4 text-sm"
                data-testid="input-admin-confirm-password"
              />
            </label>
          </div>

          <label className="block border-t border-border/70 pt-5">
            <span className="mb-1.5 block text-xs font-bold">Current password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="focus-ring min-h-12 w-full rounded-xl border border-input bg-background px-4 text-sm"
              data-testid="input-admin-current-password"
            />
          </label>

          <p className="rounded-xl bg-muted/70 px-4 py-3 text-xs leading-5 text-muted-foreground">
            Saving a username or password change signs out other Admin sessions. This session will stay signed in.
          </p>

          {error && <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs leading-5 text-destructive" data-testid="status-admin-credentials-error">{error}</p>}
          {success && <p role="status" className="rounded-xl border border-accent/20 bg-accent/5 px-3 py-2.5 text-xs leading-5 text-foreground" data-testid="status-admin-credentials-success">{success}</p>}

          <button
            type="submit"
            disabled={busy}
            className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-extrabold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            data-testid="button-save-admin-credentials"
          >
            {busy && <LoaderCircle className="animate-spin" size={17} />}
            {busy ? "Saving…" : "Save credentials"}
          </button>
        </form>
      </section>
    </div>
  );
}
