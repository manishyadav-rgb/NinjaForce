type QueryResult<T> = {
  rows: T[];
};

type PoolLike = {
  query: <T = Record<string, unknown>>(text: string, params?: unknown[]) => Promise<QueryResult<T>>;
};

declare global {
  var qhPgPool: PoolLike | undefined;
}

function getConnectionString() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured");
  return databaseUrl;
}

export function getDb() {
  if (!globalThis.qhPgPool) {
    const { Pool } = require("pg");
    globalThis.qhPgPool = new Pool({
      connectionString: getConnectionString(),
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }

  return globalThis.qhPgPool as PoolLike;
}

export async function query<T = Record<string, unknown>>(text: string, params?: unknown[]) {
  return getDb().query<T>(text, params);
}

export const db: PoolLike = {
  query,
};
