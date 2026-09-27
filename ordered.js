// ordered.js：升序插入与分裂点
export function insertAt(list, key) {
  const out = list.slice();
  let spot = out.length;
  for (let i = 0; i < out.length; i += 1) {
    if (out[i] >= key) { spot = i; break; }
  }
  out.splice(spot, 0, key);
  return out;
}

export function splitPoint(size) {
  return Math.ceil(size / 2);
}
