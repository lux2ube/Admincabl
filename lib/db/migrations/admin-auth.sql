CREATE TABLE IF NOT EXISTS "admin_auth_credentials" (
  "id" integer PRIMARY KEY DEFAULT 1,
  "username" text NOT NULL,
  "password_hash" text NOT NULL,
  "password_salt" text NOT NULL,
  "session_key" text NOT NULL,
  "session_version" integer NOT NULL DEFAULT 1,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "admin_auth_credentials_singleton" CHECK ("id" = 1)
);

CREATE TABLE IF NOT EXISTS "admin_auth_login_attempts" (
  "key_hash" text PRIMARY KEY,
  "window_started_at" timestamptz NOT NULL DEFAULT now(),
  "attempts" integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "admin_auth_login_attempts_window_started_at_idx"
  ON "admin_auth_login_attempts" ("window_started_at");
