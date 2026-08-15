const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body (e.g. some error responses) - fine
  }

  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  }

  return data;
}

export const api = {
  register: (payload) => request("/api/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: payload }),
  me: (token) => request("/api/auth/me", { token }),

  getTrips: (token) => request("/api/groups", { token }),
  getTrip: (token, id) => request(`/api/groups/${id}`, { token }),
  createTrip: (token, payload) => request("/api/groups", { method: "POST", body: payload, token }),
  addMember: (token, id, email) =>
    request(`/api/groups/${id}/members`, { method: "POST", body: { email }, token }),

  getExpenses: (token, tripId) => request(`/api/expenses/group/${tripId}`, { token }),
  addExpense: (token, payload) => request("/api/expenses", { method: "POST", body: payload, token }),
  deleteExpense: (token, id) => request(`/api/expenses/${id}`, { method: "DELETE", token }),

  getBalances: (token, tripId) => request(`/api/expenses/group/${tripId}/balances`, { token }),
};

export { ApiError };
