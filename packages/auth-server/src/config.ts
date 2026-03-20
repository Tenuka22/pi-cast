// Environment variables for auth-server package
// These should be set in the application using this package

function getEnvVar(name: string): string {
  const value = process.env[name]
  if (value === undefined) {
    throw new Error(`Environment variable ${name} is required`)
  }
  return value
}

export const BETTER_AUTH_URL = getEnvVar("BETTER_AUTH_URL")
export const BETTER_AUTH_BASE_PATH = "/api/auth"
export const BETTER_AUTH_COOKIE_PREFIX = "better-auth"
