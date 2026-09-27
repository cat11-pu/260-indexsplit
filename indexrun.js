// indexrun.js：按插入预算落键并留账，收尾清账
import { insertAt, splitPoint } from "./ordered.js";

function dupCode(spec) {
  return (spec && spec.duplicate_error_code) || "E_DUPLICATE_KEY";
}

function eventCode(spec) {
  return (spec && spec.event_error_code) || "E_BAD_EVENT";
}

function isKeyEvent(event) {
  return event !== null && typeof event === "object"
    && event.kind === "key"
    && typeof event.key === "number"
    && Number.isFinite(event.key);
}

function inBlocks(blocks, key) {
  for (const block of blocks) {
    for (const held of block) {
      if (held === key) return true;
    }
  }
  return false;
}

function inLedger(pending, key) {
  for (const row of pending) {
    if (row[0] === key) return true;
  }
  return false;
}

// 找到第一个末键不小于 key 的块，找不到就落到最后一块
function locate(blocks, key) {
  for (let spot = 0; spot < blocks.length; spot += 1) {
    const block = blocks[spot];
    if (block.length > 0 && block[block.length - 1] >= key) return spot;
  }
  return blocks.length - 1;
}

function plant(blocks, key, capacity) {
  const spot = locate(blocks, key);
  const next = blocks.slice();
  if (spot < 0) {
    next.push([key]);
    return next;
  }
  next[spot] = insertAt(next[spot], key);
  if (next[spot].length > capacity) {
    const cut = splitPoint(next[spot].length);
    const front = next[spot].slice(0, cut);
    const back = next[spot].slice(cut);
    next.splice(spot, 1, front, back);
  }
  return next;
}

export function step(spec) {
  const start = spec.state;
  const events = spec.events || [];
  const capacity = spec.capacity;
  let blocks = start.blocks.map(function (block) { return block.slice(); });
  let pending = start.pending.map(function (row) { return row.slice(); });
  let applied = start.applied.slice();
  let remaining = spec.budget;
  let inserted = 0;

  for (const event of events) {
    if (!isKeyEvent(event)) {
      const error = new Error("event is not a key event");
      error.code = eventCode(spec);
      throw error;
    }
    const key = event.key;
    // 已经处理过（如收尾后重放）：直接跳过，不再插入也不报错
    if (applied.indexOf(key) !== -1) continue;
    // 重复键：由块与账推出
    if (inBlocks(blocks, key) || inLedger(pending, key)) {
      const error = new Error("duplicate key " + key);
      error.code = dupCode(spec);
      throw error;
    }
    if (remaining > 0) {
      blocks = plant(blocks, key, capacity);
      applied.push(key);
      remaining -= 1;
      inserted += 1;
    } else {
      pending.push([key]);
    }
  }

  return {
    state: { blocks: blocks, pending: pending, applied: applied },
    inserted: inserted,
    pending_before: pending.length,
    pending_keys: pending.map(function (row) { return row[0]; }),
    judged: inserted,
    judged_bound: events.length
  };
}

export function close(spec) {
  const start = spec.state;
  const capacity = spec.capacity;
  let blocks = start.blocks.map(function (block) { return block.slice(); });
  let pending = start.pending.map(function (row) { return row.slice(); });
  const applied = start.applied.slice();
  let catchup = 0;

  // 不限预算，按账面顺序把键全部插入
  while (pending.length > 0) {
    const row = pending.shift();
    const key = row[0];
    blocks = plant(blocks, key, capacity);
    if (applied.indexOf(key) === -1) applied.push(key);
    catchup += 1;
  }

  return {
    state: { blocks: blocks, pending: pending, applied: applied },
    catchup: catchup
  };
}
