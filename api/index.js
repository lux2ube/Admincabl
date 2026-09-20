import app from "../artifacts/api-server/dist/vercel.mjs";

// The root Vercel deployment builds the API bundle before Vercel packages
// this serverless entry point.
export default app;