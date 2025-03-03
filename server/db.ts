import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create a Neon connection
const sql = neon(process.env.DATABASE_URL);

// Create a Drizzle instance
export const db = drizzle(sql);
