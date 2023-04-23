/**
 * Filo.
 *
 * Inspired by the best and smallest parts of `layer-compose`.
 * This is it. These are the best parts.
 * Fit into one file.
 *
 * Authorship: Anton Kats
 * Copyleft: absolutely free for any use with no warranties, as long as the derivative work remains copyleft
 *
 * Upcoming features:
 * - Full swap through global layer by id registry
 * - Check that constructors are not async
 *
 * Features completed:
 * - Sync functions must remain sync through all layers
 * - Lenses can be specified as functions that return (classical override) (NOV 2022)
 * */

import {
  FILO_CLASS,
  FILO_CONSTITUENTS,
  FILO_HAS_CONSTRUCTOR,
  FILO_LAYERS,
  FILO_NEW,
  FILO_PARENT,
  FILO_PROTOTYPE,
  FILO_PROXY_TARGET,
  FILO_TYPE_ID,
  IS_DEV_MODE
} from "./constants.mjs";
import {reduceToPrototype} from "./reduceToPrototype.mjs";
import {unwrapProxy} from "./unwrapProxy.mjs";

let typeId = 1

export function getNextTypeId() {
  return typeId++
}

export function filo(...layers) {
  // preventing overwrap
  if (layers.length === 1 && layers[0][FILO_PROTOTYPE]) {
    return layers[0]
  }

  const composed = function (a, opts) {
    if (opts?.parent) {
      this[FILO_PARENT] = opts.parent
    }
    if (IS_DEV_MODE) {
      const _this = new Proxy(this, {
        set(_this, k, v) {
          throw new Error('Cannot change values from outside the class')
        },
        get(_this, key) {
          // todo. implement private keys (accessible only by a specific layer)
          if (key === FILO_PROXY_TARGET) return _this
          if (typeof key == 'string' && key.startsWith('_')) {
            throw new Error('Private keys cannot be accessed')
          }
          return _this[key]
        }
      })

      const r = _this.constructor(a)
      if (r && r.then && typeof r.then === 'function') throw new Error('Constructors must be synchronous')

      // if a class has no constructor, we do expect an empty object
      if (r && Object.keys(r).length) {
        throw new Error('Constructors must not return. Use case not supported yet. Please contact authors with your use case')
      }

      return _this
    } else {
      this.constructor(a)
      return this
    }

  }

  const prototype = layers.reduce(reduceToPrototype, {[FILO_CONSTITUENTS]: []})

  // composed[FILO_PROTOTYPE] = prototype

  prototype[FILO_TYPE_ID] = typeId++
  prototype[FILO_LAYERS] = layers

  const sealed = {
    [FILO_TYPE_ID]: prototype[FILO_TYPE_ID],
    [FILO_CONSTITUENTS]: prototype[FILO_CONSTITUENTS],
    [FILO_HAS_CONSTRUCTOR]: prototype[FILO_HAS_CONSTRUCTOR],
  }
  for (const k of Object.keys(prototype)) {
    if (!prototype[k][FILO_PROTOTYPE]) {

      // if it's a function or a functional Lens
      if (IS_DEV_MODE) {
        sealed[k] = function (arg) {
          const _this = this[FILO_PROXY_TARGET] || this
          const r = prototype[k].call(_this, arg)

          // lens functions can return
          if (prototype[k]._IS_LENS) {
            return r
          }

          // empty output (code must not rely on return values)
          if (r?.then) {
            return r.then(() => {
            })
          }
        }
      } else {
        sealed[k] = prototype[k]
      }

    } else {
      // if it's a Lens
      const lensConstructor = function (arg) {
        const fn = prototype[k][FILO_CLASS]

        const lens = new fn(arg, {parent: this})
        return lens
      }
      copyFiloProperties(prototype[k], lensConstructor)
      sealed[k] = lensConstructor
    }
  }

  composed.prototype = sealed

  const constructor = function (arg) {
    return new composed(arg)
  }

  constructor[FILO_PROTOTYPE] = prototype
  constructor[FILO_CLASS] = composed

  // !!!
  composed.prototype[FILO_NEW] = constructor


  // allow post seal modifications only in dev mode
  if (IS_DEV_MODE) {
    constructor.append = function (...layers) {
      const originalId = constructor[FILO_PROTOTYPE][FILO_TYPE_ID]
      const mod = filo(constructor, ...layers)
      constructor[FILO_CLASS] = mod[FILO_CLASS]
      constructor[FILO_PROTOTYPE] = mod[FILO_PROTOTYPE]
      constructor[FILO_PROTOTYPE][FILO_TYPE_ID] = originalId
      constructor.prototype = mod.prototype
      composed.prototype = mod[FILO_CLASS].prototype
    }
  }
  constructor.setTypeId = function (id) {
    if (typeof id !== 'string') throw new Error('Id must be a string')
    prototype[FILO_TYPE_ID] = sealed[FILO_TYPE_ID] = id

    return constructor
  }

  return constructor
}

function copyFiloProperties(from, to) {
  to[FILO_PROTOTYPE] = from[FILO_PROTOTYPE]
  to[FILO_TYPE_ID] = from[FILO_TYPE_ID]
  to[FILO_CONSTITUENTS] = from[FILO_CONSTITUENTS]
  to[FILO_HAS_CONSTRUCTOR] = from[FILO_HAS_CONSTRUCTOR]
  to._IS_LENS = from._IS_LENS

}

export function parent(_this, setTo) {
  // if (!_this[FILO_PROXY_TARGET] || !_this[FILO_PARENT]?.[FILO_PROXY_TARGET]) debugger

  if (!_this) throw new Error('Cannot get parent of nothing')
  if (!setTo) {
    return _this[FILO_PARENT]
  } else {
    unwrapProxy(_this)[FILO_PARENT] = setTo
  }
}

