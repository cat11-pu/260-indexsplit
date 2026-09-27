// indexrun.js：按插入预算落键并留账（基线：一律给空表）
import { insertAt, splitPoint } from "./ordered.js";

export function step(spec) {
  return { state: spec.state, inserted: 0, pending_before: 0, pending_keys: [],
           judged: 0, judged_bound: 0 };
}

export function close(spec) {
  return { state: spec.state, catchup: 0 };
}
