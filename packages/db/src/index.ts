import { drizzle } from "drizzle-orm/libsql"
import * as schema from "./schema"

export function createDb(databaseUrl: string) {
  return drizzle(databaseUrl, { schema })
}

export * from "./auth"
export type { Auth } from "./auth/init"
