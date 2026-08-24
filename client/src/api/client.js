const TOKEN_KEY = "inkwell.token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** Thrown for any non-2xx response, carrying the status so pages can branch on it. */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

let onUnauthorized = null;
/** AuthContext registers a callback here so an expired token logs the user out. */
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    if (res.status === 401 && token && onUnauthorized) onUnauthorized();
    throw new ApiError(
      res.status,
      data.error || `Request failed (${res.status})`,
    );
  }
  return data;
}

export const api = {
  register: (payload) =>
    request("/auth/register", { method: "POST", body: payload, auth: false }),
  login: (payload) =>
    request("/auth/login", { method: "POST", body: payload, auth: false }),
  me: () => request("/auth/me"),

  listPosts: ({ page = 1, limit = 10 } = {}) =>
    request(`/posts?page=${page}&limit=${limit}`),
  myPosts: () => request("/posts/mine"),
  getPost: (id) => request(`/posts/${id}`),
  createPost: (payload) => request("/posts", { method: "POST", body: payload }),
  updatePost: (id, payload) =>
    request(`/posts/${id}`, { method: "PUT", body: payload }),
  deletePost: (id) => request(`/posts/${id}`, { method: "DELETE" }),

  vote: (id, value) =>
    request(`/posts/${id}/vote`, { method: "POST", body: { value } }),

  listComments: (id) => request(`/posts/${id}/comments`),
  addComment: (id, body) =>
    request(`/posts/${id}/comments`, { method: "POST", body: { body } }),
  deleteComment: (id) => request(`/comments/${id}`, { method: "DELETE" }),
};
