function createHeaders(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.ok) {
    return { ok: false, status: response.status, error: body.error ?? "접속자 상태를 갱신하지 못했습니다." };
  }
  return body;
}

export function createPresenceClient({ apiBaseUrl, fetchImpl = fetch, getToken = () => "" }) {
  const baseUrl = String(apiBaseUrl ?? "").replace(/\/$/, "");

  async function post(path, body) {
    try {
      const response = await fetchImpl(`${baseUrl}/presence${path}`, {
        method: "POST",
        headers: createHeaders(getToken()),
        body: JSON.stringify(body),
      });
      return readResponse(response);
    } catch {
      return { ok: false, status: 0, error: "리빌딩 서버에 연결할 수 없습니다." };
    }
  }

  return {
    sync: (payload) => post("/sync", payload),
    leave: (payload) => post("/leave", payload),
  };
}
