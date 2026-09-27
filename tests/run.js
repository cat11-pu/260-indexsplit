import assert from "node:assert";
import { insertAt, splitPoint } from "../ordered.js";
import { step, close } from "../indexrun.js";
import { render } from "../app.js";

const base = {
  budget: 3, capacity: 3,
  state: { blocks: [], pending: [], applied: [] },
  events: [],
  duplicate_error_code: "E_DUPLICATE_KEY", event_error_code: "E_BAD_EVENT"
};

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("insertAt returns a list", () => {
  assert.ok(Array.isArray(insertAt([1], 2)));
});

check("splitPoint returns a number", () => {
  assert.strictEqual(typeof splitPoint(4), "number");
});

check("step returns a state", () => {
  assert.strictEqual(typeof step(base).state, "object");
});

check("close returns a state", () => {
  assert.strictEqual(typeof close(base).state, "object");
});

check("render counts events", () => {
  assert.strictEqual(typeof render(base).count, "number");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
