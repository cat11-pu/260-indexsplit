// ordered.js：升序插入与分裂点
export function insertAt(list, key) {
  const next = list.slice();
  let spot = 0;
  while (spot < next.length && next[spot] < key) {
    spot += 1;
  }
  next.splice(spot, 0, key);
  return next;
}

export function splitPoint(size) {
  return Math.ceil(size / 2);
}
