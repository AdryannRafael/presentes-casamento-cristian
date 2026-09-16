import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "@/enviroment";
import { Pool } from "pg";
import { DbException } from "@/src/shared/error/exceptions";

export function CreateUri() {
  return `postgres://${env.DB_USERNAME}:${env.DB_PASSWORD}@${env.DB_HOST}/${env.DB_NAME}`;
}

export const pool = new Pool({
  connectionString: CreateUri(),
  max: 20,
  idleTimeoutMillis: 30 * 1000,
  connectionTimeoutMillis: 2 * 1000,
});

// export const db = drizzle(pool, { schema: authTables });
export const db = drizzle({ client: pool });

export async function CheckDatabaseConnection() {
  const client = await pool.connect();

  try {
    await client.query("SELECT 1");
    return true;
  } catch (e) {
    throw new DbException(
      "Não conseguiu estabeler uma conexão com o banco",
      "connection",
    );
  } finally {
    client.release();
  }
}
