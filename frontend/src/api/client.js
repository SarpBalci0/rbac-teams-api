const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

function buildHeaders({ body, auth }) {
  const headers = {};
  if (body) {
    headers["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = localStorage.getItem("authToken");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  return headers;
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function request(
  path,
  { method = "GET", body, auth = true } = {}
) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: buildHeaders({ body, auth }),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      (data && data.detail) ||
      (data && data.message) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export function mapApiError(error) {
  if (!error) {
    return "Something went wrong";
  }
  const message = typeof error === "string" ? error : error.message;
  switch (message) {
    case "Unauthorized":
      return "Session expired";
    case "Insufficient permissions":
    case "Not a member of this team":
      return "You don’t have permission";
    case "Team not found":
      return "Team not found";
    case "User is already a member":
      return "User already a member";
    default:
      return message || "Something went wrong";
  }
}
