import { os } from "@orpc/server"

/**
 * Base context interface for oRPC handlers
 */
export interface BaseContext {
  headers: Headers
}

/**
 * Base oRPC context builder
 */
export const base = os.$context<BaseContext>()

export * from "./schemas/index"
export * from "./errors"
export * from "./middleware"
export * from "./routes/index"
