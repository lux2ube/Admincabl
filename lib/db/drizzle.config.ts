import { defineConfig } from "drizzle-kit";
import path from "path";

const databaseUrl = process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("SUPABASE_DATABASE_URL must be set; Drizzle Kit does not use DATABASE_URL.");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
