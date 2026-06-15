import { getAuthToken, logout } from "./auth";

export async function authFetch(resource, options = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(resource, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    logout();

    if (window.location.pathname !== "/login") {
      window.location.assign("/login?session=expired");
    }
  }

  return response;
}
