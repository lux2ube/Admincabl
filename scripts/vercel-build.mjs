import { spawn } from "node:child_process";
import { access, cp, mkdir, rm } from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const root = process.cwd();
const apiDir = path.join(root, "artifacts", "api-server");
const storeDir = path.join(root, "artifacts", "cabl-store");
const adminDir = path.join(root, "artifacts", "cabl-admin");
const publicDir = path.join(storeDir, "dist", "public");
const adminPublicDir = path.join(adminDir, "dist", "public");
const prerenderPort = "8787";

function run(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, ...env },
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed with ${signal || `exit code ${code}`}`));
    });
  });
}

function waitForApi(port, timeoutMs = 30_000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(`http://127.0.0.1:${port}/api/healthz`, (response) => {
        response.resume();
        if (response.statusCode === 200) {
          resolve();
          return;
        }
        retry();
      });
      request.once("error", retry);
      request.setTimeout(2_000, () => {
        request.destroy();
        retry();
      });
    };
    const retry = () => {
      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error(`The local prerender API did not become ready on port ${port}.`));
        return;
      }
      setTimeout(check, 250);
    };
    check();
  });
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

let prerenderApi;
try {
  await run("pnpm", ["--filter", "@workspace/api-server", "run", "build"]);

  const canPrerender = Boolean(process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL);
  if (canPrerender) {
    prerenderApi = spawn("node", ["--enable-source-maps", path.join(apiDir, "dist", "index.mjs")], {
      cwd: root,
      env: { ...process.env, NODE_ENV: "production", PORT: prerenderPort },
      stdio: "inherit",
    });
    await waitForApi(prerenderPort);
  } else {
    console.warn("Vercel build: database URL is not configured; catalog SEO prerendering is skipped.");
  }

  await run("pnpm", ["--filter", "@workspace/cabl-store", "run", "build"], {
    BASE_PATH: "/",
    VITE_API_BASE_URL: "",
    ...(prerenderApi
      ? { SEO_PRERENDER_API_URL: `http://127.0.0.1:${prerenderPort}/api` }
      : { SKIP_SEO_PRERENDER: "1" }),
  });

  await run("pnpm", ["--filter", "@workspace/cabl-admin", "run", "build"], {
    PORT: "22761",
    BASE_PATH: "/admin/",
  });

  if (!(await exists(path.join(publicDir, "index.html")))) {
    throw new Error(`Storefront build did not produce ${publicDir}/index.html`);
  }
  if (!(await exists(path.join(adminPublicDir, "index.html")))) {
    throw new Error(`Admin build did not produce ${adminPublicDir}/index.html`);
  }

  await rm(path.join(publicDir, "admin"), { recursive: true, force: true });
  await mkdir(path.join(publicDir, "admin"), { recursive: true });
  await cp(adminPublicDir, path.join(publicDir, "admin"), { recursive: true });
  console.log(`Vercel build complete: ${publicDir}`);
} finally {
  if (prerenderApi && !prerenderApi.killed) {
    prerenderApi.kill("SIGTERM");
  }
}