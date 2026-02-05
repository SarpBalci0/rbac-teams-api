const DEFAULT_API_ROOT = "http://127.0.0.1:8000/api/v1";

function resolveApiRoot(rawValue) {
  if (!rawValue) return DEFAULT_API_ROOT;
  const trimmed = String(rawValue).replace(/\/+$/, "");
  if (trimmed.endsWith("/api/v1")) return trimmed;
  return `${trimmed}/api/v1`;
}

const API_ROOT = resolveApiRoot(import.meta.env.VITE_API_URL);

export class ApiError extends Error {
  constructor(message, { status, data, isNetworkError, cause } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.isNetworkError = Boolean(isNetworkError);
    this.cause = cause;
  }
}

export async function apiRequest(path, { method = "GET", body, token } = {}) {
  const headers = {};
  const authToken =
    token !== undefined ? token : localStorage.getItem("authToken");
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const url = `${API_ROOT}${path}`;
  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch (cause) {
    let apiOrigin = null;
    try {
      apiOrigin = new URL(API_ROOT).origin;
    } catch (error) {
      apiOrigin = API_ROOT;
    }
    throw new ApiError(
      `Cannot reach server (is backend running on ${apiOrigin}?). If it is running, this may be a CORS or mixed-content issue.`,
      { isNetworkError: true, cause }
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const raw = await response.text();
  let data = null;
  if (raw) {
    if (isJson) {
      try {
        data = JSON.parse(raw);
      } catch (error) {
        data = null;
      }
    } else {
      data = raw;
    }
  }

  if (!response.ok) {
    const detail = data?.detail;
    let message = "Request failed";
    if (Array.isArray(detail)) {
      const parts = detail
        .map((item) => item?.msg || item?.message || String(item))
        .filter(Boolean);
      if (parts.length) {
        message = parts.join(", ");
      }
    } else if (typeof detail === "string" && detail.trim()) {
      message = detail;
    } else if (detail != null) {
      message = String(detail);
    } else if (typeof data === "string" && data.trim()) {
      message = data.trim();
    } else if (response.statusText) {
      message = response.statusText;
    }
    throw new ApiError(message, { status: response.status, data });
  }

  return data;
}
