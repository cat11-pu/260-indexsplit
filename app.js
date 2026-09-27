// app.js：渲染结果
import { insertAt, splitPoint } from "./ordered.js";
import { step, close } from "./indexrun.js";

export function render(spec) {
  const events = spec.events || [];
  const half = Math.ceil(events.length / 2);
  const first = step(spec);
  const closed = close(Object.assign({}, spec, { state: first.state }));
  const r1 = step(Object.assign({}, spec, { events: events.slice(0, half) }));
  const r2 = step(Object.assign({}, spec, { state: r1.state, events: events.slice(half) }));
  const closedTwo = close(Object.assign({}, spec, { state: r2.state }));
  const replay = step(Object.assign({}, spec, { state: closed.state }));
  const wide = step(Object.assign({}, spec, { budget: spec.budget + 2 }));
  const full = step(Object.assign({}, spec, { budget: events.length + 2 }));
  const fullClosed = close(Object.assign({}, spec, { state: full.state }));
  const fingerprint = function (state) {
    return JSON.stringify({
      blocks: state.blocks, pending: state.pending.map(function (row) { return row[0]; }),
      applied: state.applied.length
    });
  };
  const blocks = closed.state.blocks.map(function (block) { return block.slice(); });
  const sizes = blocks.map(function (block) { return block.length; });
  return { blocks: blocks, block_count: blocks.length, block_sizes: sizes,
           max_block: sizes.reduce(function (max, size) { return size > max ? size : max; }, 0),
           total_keys: sizes.reduce(function (sum, size) { return sum + size; }, 0),
           inserted_first: first.inserted, inserted_wide: wide.inserted,
           pair_differs: first.inserted !== wide.inserted,
           pending_before: first.pending_before, pending_keys: first.pending_keys,
           catchup: closed.catchup, pending_after: closed.state.pending.length,
           mid_differs: fingerprint(r2.state) !== fingerprint(first.state),
           closed_equal: fingerprint(closedTwo.state) === fingerprint(closed.state),
           replay_new: replay.inserted, judged: first.judged, judged_bound: first.judged_bound,
           full_diff: fingerprint(closed.state) === fingerprint(fullClosed.state) ? 0 : 1,
           count: events.length,
           tail: insertAt([], 1).length + splitPoint(4) };
}
