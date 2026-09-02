function createHeaders(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.ok) {
    return { ok: false, status: response.status, error: body.error ?? "황무지 월드 요청에 실패했습니다.", world: body.world ?? null };
  }
  return { ok: true, world: body.world ?? null };
}

export function createWastelandWorldClient({ apiBaseUrl, fetchImpl = fetch, getToken }) {
  function getUrl(path) {
    return `${String(apiBaseUrl ?? "").replace(/\/$/, "")}/world${path}`;
  }

  async function load() {
    try {
      const response = await fetchImpl(getUrl("/wasteland"), {
        headers: createHeaders(getToken?.()),
      });
      return readResponse(response);
    } catch {
      return { ok: false, status: 0, error: "황무지 서버에 연결할 수 없습니다.", world: null };
    }
  }

  async function dispatch({ action, knownRevision, wastelandState }) {
    try {
      const response = await fetchImpl(getUrl("/wasteland/actions"), {
        method: "POST",
        headers: createHeaders(getToken?.()),
        body: JSON.stringify({ action, knownRevision, wastelandState }),
      });
      return readResponse(response);
    } catch {
      return { ok: false, status: 0, error: "황무지 서버에 연결할 수 없습니다.", world: null };
    }
  }

  return { load, dispatch };
}
