// indexrun.js：按插入预算落键并留账
import { insertAt, splitPoint } from "./ordered.js";

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function copyState(state) {
  const src = state || {};
  return {
    blocks: (src.blocks || []).map(function (block) { return block.slice(); }),
    pending: (src.pending || []).map(function (row) { return row.slice(); }),
    applied: (src.applied || []).slice()
  };
}

function hasKey(state, key) {
  for (const block of state.blocks) {
    if (block.indexOf(key) !== -1) return true;
  }
  for (const row of state.pending) {
    if (row[0] === key) return true;
  }
  return false;
}

function insertKey(state, key, capacity) {
  let spot = -1;
  for (let i = 0; i < state.blocks.length; i += 1) {
    const block = state.blocks[i];
    if (block.length > 0 && block[block.length - 1] >= key) { spot = i; break; }
  }
  if (spot === -1) {
    if (state.blocks.length === 0) {
      state.blocks.push([key]);
      return;
    }
    spot = state.blocks.length - 1;
  }
  state.blocks[spot] = insertAt(state.blocks[spot], key);
  if (state.blocks[spot].length > capacity) {
    const cut = splitPoint(state.blocks[spot].length);
    const back = state.blocks[spot].slice(cut);
    state.blocks[spot] = state.blocks[spot].slice(0, cut);
    state.blocks.splice(spot + 1, 0, back);
  }
}

function checkEvent(spec, event) {
  if (!event || typeof event !== "object" || event.kind !== "key"
      || typeof event.key !== "number" || !Number.isFinite(event.key)) {
    fail(spec.event_error_code || "E_BAD_EVENT", "bad event");
  }
}

export function step(spec) {
  const state = copyState(spec.state);
  const events = spec.events || [];
  const dupCode = spec.duplicate_error_code || "E_DUPLICATE_KEY";
  let budget = spec.budget;
  let inserted = 0;
  let judged = 0;
  for (const event of events) {
    checkEvent(spec, event);
    if (state.applied.indexOf(event.id) !== -1) continue;
    if (hasKey(state, event.key)) fail(dupCode, "duplicate key " + event.key);
    judged += 1;
    if (budget > 0) {
      insertKey(state, event.key, spec.capacity);
      budget -= 1;
      inserted += 1;
    } else {
      state.pending.push([event.key, event.id]);
    }
    state.applied.push(event.id);
  }
  return {
    state: state,
    inserted: inserted,
    pending_before: state.pending.length,
    pending_keys: state.pending.map(function (row) { return row[0]; }),
    judged: judged,
    judged_bound: events.length
  };
}

export function close(spec) {
  const state = copyState(spec.state);
  let catchup = 0;
  while (state.pending.length > 0) {
    const row = state.pending.shift();
    insertKey(state, row[0], spec.capacity);
    catchup += 1;
  }
  return { state: state, catchup: catchup };
}
