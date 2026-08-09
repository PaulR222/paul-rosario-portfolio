import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the portfolio", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Paul Rosario/);
});

test("server-renders the photography archive", async () => {
  const response = await render("/photography");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Paul Photography/i);
  assert.match(html, /3 photographs/i);
  assert.match(html, /Sunlit hand wearing a silver watch on a steering wheel/i);
  assert.doesNotMatch(html, /latitude|longitude/i);
});
