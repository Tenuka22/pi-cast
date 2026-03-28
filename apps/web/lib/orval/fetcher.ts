import { extractAuthCookies } from "./auth"

export type FetcherConfig<TData = unknown, TParams = unknown> = {
  url: string
  method: string
  signal?: AbortSignal
  data?: TData
  headers?: HeadersInit
  credentials?: RequestCredentials
  params?: TParams
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

const buildBody = (data: unknown, headers: Headers) => {
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

const buildQueryString = <TParams extends Record<string, unknown> | undefined>(
  params?: TParams
): string => {
  if (!params) return ""

  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    )
    .join("&")

  return query ? `?${query}` : ""
}

export const authFetch = async <
  T,
  TData = unknown,
  TParams extends Record<string, unknown> | undefined = Record<string, unknown>,
>(
  {
    url,
    method,
    signal,
    data,
    headers,
    credentials,
    params,
  }: FetcherConfig<TData, TParams>,
  init?: RequestInit & {
    cookie?: string | null
    baseUrl?: string
    pathParams?: Record<string, string | number>
  }
): Promise<T> => {
  const mergedHeaders = new Headers(headers ?? {})
  const allCookies = await resolveCookie(init?.cookie)
  const cookie = extractAuthCookies(allCookies)

  // Debug logging in development
  if (process.env.NODE_ENV === "development") {
    console.log("[authFetch] All cookies:", allCookies?.substring(0, 50) + "...")
    console.log("[authFetch] Auth cookies:", cookie?.substring(0, 50) + "...")
  }

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
    `${init?.baseUrl ?? DEFAULT_BASE_URL}${finalUrl}`,
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
    const error = new Error(`API Error ${response.status}: ${errorText || response.statusText}`)
    // Attach response status for better error handling
    ;(error as any).status = response.status
    ;(error as any).responseText = errorText
    throw error
  }

  const contentType = response.headers.get("content-type")

  // Handle response based on content type
  if (contentType?.includes("application/json")) {
    const jsonData: unknown = await response.json()
    return jsonData as T // eslint-disable-line @typescript-eslint/consistent-type-assertions
  }

  const textData: string = await response.text()
  return textData as T // eslint-disable-line @typescript-eslint/consistent-type-assertions
}
