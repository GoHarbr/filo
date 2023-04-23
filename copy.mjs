export function copy(what, by) {
  const copied = {}

  const p = new Proxy(what, {
    get(_this, k) {
      copied[k] = _this[k]
      return p
    }
  })

  by(p)

  return copied
}