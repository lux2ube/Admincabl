import app from "../src/app";

// Vercel invokes the exported Express application as a serverless function.
// The local Replit workflow continues to use src/index.ts, which owns app.listen().
export default app;