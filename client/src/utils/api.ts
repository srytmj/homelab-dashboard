export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('cockpit_token');
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}
