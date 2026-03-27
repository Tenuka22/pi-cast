// Authentication Constants
export const BETTER_AUTH_BASE_PATH = "/api/auth"
export const BETTER_AUTH_COOKIE_PREFIX = "pi-cast-auth"
export const ADMIN_EMAIL = "tenukaomaljith2009@gmail.com"
export const SERVER_URL = (globalThis as unknown as { process?: { env?: Record<string, string> } })?.process?.env?.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:8787"
