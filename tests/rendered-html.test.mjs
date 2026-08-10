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
  assert.doesNotMatch(html, /Paul R Photography/i);
  assert.doesNotMatch(html, /\d+ photographs/i);
  for (const archiveNumber of ["001", "002", "003", "004"]) assert.match(html, new RegExp(`data-archive-number="${archiveNumber}"`));
  const archivePositions = ["001", "002", "003", "004"].map((archiveNumber) => html.indexOf(`data-archive-number="${archiveNumber}"`));
  assert.deepEqual(archivePositions, archivePositions.toSorted((a, b) => a - b));
  assert.match(html, /Sunlit hand wearing a silver watch on a steering wheel/i);
  assert.doesNotMatch(html, /latitude|longitude/i);
});
