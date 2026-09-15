import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const port = Number(process.env.PORT);
const basePath = (process.env.BASE_PATH || "/cabl-store/").replace(/\/+$/, "");
const artifactRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "artifacts/cabl-store/dist/public");

if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`Invalid PORT value: ${process.env.PORT || ""}`);
}

const clientRoutes = [
  /^\/search$/,
  /^\/compare$/,
  /^\/cart$/,
  /^\/checkout$/,
  /^\/orders$/,
  /^\/order\/[^/]+$/,
];

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function sendFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    "Content-Type": contentTypes[extension] || "application/octet-stream",
    "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
  });
  fs.createReadStream(filePath).pipe(response);
}

function safePath(relativePath) {
  const normalized = path.posix.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.resolve(artifactRoot, `.${normalized.startsWith("/") ? normalized : `/${normalized}`}`);
  return filePath.startsWith(`${artifactRoot}${path.sep}`) || filePath === artifactRoot ? filePath : null;
}

function routePath(urlPath) {
  if (urlPath === basePath || urlPath === `${basePath}/`) return "/";
  if (!urlPath.startsWith(`${basePath}/`)) return null;
  return urlPath.slice(basePath.length) || "/";
}

function serve(request, response) {
  const requestUrl = new URL(request.url || "/", "http://localhost");
  const route = routePath(requestUrl.pathname);
  if (!route) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  if (route !== "/" && route.endsWith("/")) {
    response.writeHead(308, { Location: `${basePath}${route.slice(0, -1)}${requestUrl.search}` });
    response.end();
    return;
  }

  const directPath = safePath(route);
  const candidates = directPath ? [
    directPath,
    path.join(directPath, "index.html"),
  ] : [];
  const existing = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  if (existing) {
    sendFile(response, existing);
    return;
  }

  if (clientRoutes.some((pattern) => pattern.test(route))) {
    sendFile(response, path.join(artifactRoot, "index.html"));
    return;
  }

  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
}

http.createServer(serve).listen(port, "0.0.0.0", () => {
  console.log(`CABL static server listening on ${port} at ${basePath}`);
});