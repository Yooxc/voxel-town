import test from "node:test";
import assert from "node:assert/strict";
import { createWastelandWorldClient } from "../src/network/wastelandWorldClient.js";

test("sends authenticated wasteland actions with the known revision", async () => {
  let request = null;
  const client = createWastelandWorldClient({
    apiBaseUrl: "http://localhost:8787/",
    getToken: () => "session-token",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return new Response(JSON.stringify({ ok: true, world: { revision: 3 } }), { status: 200 });
    },
  });

  const result = await client.dispatch({
    action: { type: "foundation.reserve" },
    knownRevision: 2,
    wastelandState: { claims: [] },
  });
  assert.deepEqual(result, { ok: true, world: { revision: 3 } });
  assert.equal(request.url, "http://localhost:8787/world/wasteland/actions");
  assert.equal(request.options.headers.Authorization, "Bearer session-token");
  assert.equal(JSON.parse(request.options.body).knownRevision, 2);
});

test("returns a stable failure when the wasteland server is unreachable", async () => {
  const client = createWastelandWorldClient({
    apiBaseUrl: "http://localhost:8787",
    getToken: () => "session-token",
    fetchImpl: async () => { throw new Error("offline"); },
  });

  assert.deepEqual(await client.load(), {
    ok: false,
    status: 0,
    error: "황무지 서버에 연결할 수 없습니다.",
    world: null,
  });
  assert.equal((await client.dispatch({ action: { type: "structure.place" } })).ok, false);
});
