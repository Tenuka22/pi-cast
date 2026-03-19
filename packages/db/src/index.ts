import { drizzle } from "drizzle-orm/libsql"
import { ENV } from "varlock/env"
import * as schema from "./schema"

export const db = drizzle(ENV.DATABASE_URL, { schema })
