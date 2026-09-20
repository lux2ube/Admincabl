import app from "../artifacts/api-server/dist/vercel.mjs";

// Catch-all API entry for nested routes such as /api/store/catalog and
// /api/admin/metadata in the single root Vercel project.
export default app;