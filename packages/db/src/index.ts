import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql"
import * as schema from "./schema"
import { Client } from "@libsql/client"
import { createClient } from "@libsql/client"

export function createDb(databaseUrl: string, authToken: string) {
  const client = createClient({
    url: databaseUrl,
    authToken,
  })

  return drizzle(client, { schema })
}
export type Database = LibSQLDatabase<typeof schema> & {
  $client: Client
}

export * from "./auth"
export * from "./username"
export type { Auth } from "./auth/init"
