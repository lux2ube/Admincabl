import app from "../dist/vercel.mjs";

// Vercel invokes the bundled Express application as a serverless function.
// The local Replit workflow continues to use src/index.ts, which owns app.listen().
export default app;