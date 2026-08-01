export interface HttpErrorPayload {
  error?: {
    message?: string
  }
}

export interface HttpRequestOptions {
  token?: string | null
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as HttpErrorPayload | null
    const message = payload?.error?.message ?? "Request failed"
    throw new Error(message)
  }

  return (await response.json()) as T
}

function buildAuthHeaders(options: HttpRequestOptions): HeadersInit {
  return options.token ? { authorization: `Bearer ${options.token}` } : {}
}

export async function httpGet<T>(url: string, options: HttpRequestOptions = {}): Promise<T> {
  const response = await fetch(url, {
    headers: buildAuthHeaders(options)
  })

  return parseJsonResponse<T>(response)
}

export async function httpPost<T>(url: string, body: unknown, options: HttpRequestOptions = {}): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...buildAuthHeaders(options)
    },
    body: JSON.stringify(body)
  })

  return parseJsonResponse<T>(response)
}

export async function httpPatch<T>(url: string, body: unknown, options: HttpRequestOptions = {}): Promise<T> {
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      ...buildAuthHeaders(options)
    },
    body: JSON.stringify(body)
  })

  return parseJsonResponse<T>(response)
}

export async function httpDelete<T>(url: string, body: unknown, options: HttpRequestOptions = {}): Promise<T> {
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
      ...buildAuthHeaders(options)
    },
    body: JSON.stringify(body)
  })

  return parseJsonResponse<T>(response)
}
