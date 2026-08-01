export interface HttpErrorPayload {
  error?: {
    message?: string
  }
}

export async function httpGet<T>(url: string): Promise<T> {
  const response = await fetch(url)

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as HttpErrorPayload | null
    const message = payload?.error?.message ?? "Request failed"
    throw new Error(message)
  }

  return (await response.json()) as T
}
