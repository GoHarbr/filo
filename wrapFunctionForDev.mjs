import {FILO_CALLING_LAYER_ID, FILO_PROXY_TARGET, FILO_TYPE_ID, IS_DEV_MODE} from "./constants.mjs";

export const writeProtectionRegistry = {}

export function wrapFunctionForDev(fnName, _fn2, l) {
  // todo prevent overwraping
  return !IS_DEV_MODE ? _fn2 : _fn2 && function (arg) {
    let original = this[FILO_PROXY_TARGET]
    if (!original) {
      original = this
    }
    const _this = new Proxy(original, {
      set(_this, key, val) {
        let instanceTypeWrites = writeProtectionRegistry[_this[FILO_TYPE_ID]]
        if (!instanceTypeWrites) {
          instanceTypeWrites = writeProtectionRegistry[_this[FILO_TYPE_ID]] = {}
        }

        if (instanceTypeWrites[key]) {
          if (instanceTypeWrites[key] != l[FILO_TYPE_ID]) {
            throw new Error(`Only one layer can write a particular key: ${key}`)
          }
        } else {
          if (_this[key]) {
            throw new Error('Cannot overwrite pre-composed keys (eg. functions in prototype): ' + (typeof key == 'symbol' ? '[symbol]' : key))
          }
          instanceTypeWrites[key] = l[FILO_TYPE_ID]
        }

        _this[key] = val
        return true
      },

      get(_this, key) {
        // todo. implement private keys (accessible only by a specific layer)
        if (key === FILO_PROXY_TARGET) return _this
        if (key === FILO_CALLING_LAYER_ID) return l[FILO_TYPE_ID]

        if (typeof key == 'string' && key.startsWith('_')) {
          const writer = writeProtectionRegistry[_this[FILO_TYPE_ID]]
          if (writer && writer[key] && writer[key] !== l[FILO_TYPE_ID]) {
            // the way this is written, private services can be defined across different layers
            throw new Error('A private key can only be accessed by the same layer')
          }
        }

        // no undefined access (except in constructors, since it's expected)
        const v = _this[key]
        if (typeof key == 'string' && v === undefined && fnName !== 'constructor') {
          // if (_this[FILO_ACCESS_RECORD][key]) {
          throw new Error('Keys that hold `undefined` cannot be access and are assumed to be a bug. Set default values to `null` : ' + key)
          // }
        }

        if (fnName === 'constructor' && typeof v == "function") {
          return function (arg) {
            const r = v.call(this, arg)
            if (r && !r[FILO_TYPE_ID] && typeof r.then == 'function') {
              console.warn('!!\n!! Calling class methods that return a promise within constructor is a source of bugs\n!!')
            }
            return r
          }
        } else {
          return v
        }
      }
    })
    return _fn2.call(_this, arg)
  }
}