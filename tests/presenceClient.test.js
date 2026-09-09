import test from "node:test";
import assert from "node:assert/strict";
import { createPresenceClient } from "../src/network/presenceClient.js";

test("sends a local rebuild identity, position, and tour command", async () => {
  let request = null;
  const client = createPresenceClient({
    apiBaseUrl: "http://localhost:8788",
    getToken: () => "token",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return new Response(JSON.stringify({ ok: true, selfId: "local:dev:one", players: [], guides: [] }));
    },
  });
  const result = await client.sync({
    clientId: "dev:one",
    displayName: "개발자1",
    player: { x: 1, y: 0, z: 2 },
    command: { type: "tour.request", checkpointId: "rest-area" },
  });

  assert.equal(result.ok, true);
  assert.equal(request.url, "http://localhost:8788/presence/sync");
  assert.equal(request.options.headers.Authorization, "Bearer token");
  assert.equal(JSON.parse(request.options.body).command.type, "tour.request");
});
