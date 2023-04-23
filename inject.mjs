import {
  FILO_CALLING_LAYER_ID,
  FILO_CONSTITUENTS,
  FILO_PROTOTYPE,
  FILO_PROXY_TARGET,
  FILO_TYPE_ID,
  IS_DEV_MODE
} from "./constants.mjs";
import {writeProtectionRegistry} from "./wrapFunctionForDev.mjs";
import {parent} from "./filo.mjs";

export function inject(_this, constructorOfType, callingLayerId = _this[FILO_CALLING_LAYER_ID]) {
  const searchFor = constructorOfType[FILO_PROTOTYPE][FILO_TYPE_ID]

  if (_this[FILO_CONSTITUENTS].includes(searchFor) || _this[FILO_TYPE_ID] === searchFor) {

    if (IS_DEV_MODE) {
      const original = _this[FILO_PROXY_TARGET] || _this
      return new Proxy(original, {
        set(_this, k, v) {
          throw new Error('Cannot change values from outside the class')
        },
        get(_this, key) {
          // todo. implement private keys (accessible only by a specific layer)
          if (key === FILO_PROXY_TARGET) return original

          if (typeof key == 'string' && key.startsWith('_')) {
            const writer = writeProtectionRegistry[_this[FILO_TYPE_ID]]
            if (writer && writer[key] !== callingLayerId) {
              throw new Error('A private key can only be accessed by the same layer')
            }
          }
          return _this[key]
        }
      })
    } else {
      const original = _this
      return original
    }

  } else {
    const next = parent(_this)
    if (!next) throw new Error('Failed to inject')

    return inject(next, constructorOfType, callingLayerId)
  }
}