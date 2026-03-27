import { extractAuthCookies } from "./auth"

export type FetcherConfig = {
  url: string
  method: string
  signal?: AbortSignal
  data?: any
  headers?: HeadersInit
  credentials?: RequestCredentials
  params?: Record<string, any>
}

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:8787"

const resolveCookie = async (cookie?: string | null) => {
  if (cookie) return cookie

  if (typeof document !== "undefined") {
    return document.cookie
  }

  try {
    const { cookies } = await import("next/headers")
    return (await cookies()).toString()
  } catch {
    return undefined
  }
}

const buildBody = (data: any, headers: Headers) => {
  if (data === undefined || data === null) return undefined

  if (data instanceof FormData) {
    // Don't set Content-Type for FormData - let the browser set it with boundary
    return data
  }

  if (data instanceof Blob) {
    return data
  }

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  return typeof data === "string" ? data : JSON.stringify(data)
}

const buildQueryString = (params?: Record<string, any>): string => {
  if (!params) return ""

  const query = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&")

  return query ? `?${query}` : ""
}

export const authFetch = async <T>(
  { url, method, signal, data, headers, credentials, params }: FetcherConfig,
  init?: RequestInit & {
    cookie?: string | null
    baseUrl?: string
    pathParams?: Record<string, string | number>
  }
): Promise<T> => {
  const mergedHeaders = new Headers(headers ?? {})
  const cookie = extractAuthCookies(await resolveCookie(init?.cookie))

  if (cookie) {
    mergedHeaders.set("Cookie", cookie)
  }

  const body = buildBody(data, mergedHeaders)

  // Remove Content-Type for FormData to let browser set it with boundary
  if (body instanceof FormData) {
    mergedHeaders.delete("Content-Type")
  }

  const pathParams = init?.pathParams ?? {}
  let finalUrl = Object.entries(pathParams).reduce(
    (acc, [key, value]) =>
      acc.replace(`:${key}`, encodeURIComponent(String(value))),
    url
  )

  // Add query params
  finalUrl += buildQueryString(params)

  const response = await fetch(
    `${init?.baseUrl ?? DEFAULT_BASE_URL}/api${finalUrl}`,
    {
      method,
      signal,
      body,
      headers: mergedHeaders,
      credentials: credentials ?? "include",
      ...init,
    }
  )

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Request failed")
    throw new Error(errorText)
  }

  const contentType = response.headers.get("content-type")
  if (contentType?.includes("application/json")) {
    return (await response.json()) as T
  }

  return (await response.text()) as unknown as T
}
