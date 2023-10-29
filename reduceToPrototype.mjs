import {FILO_CONSTITUENTS, FILO_HAS_CONSTRUCTOR, FILO_PROTOTYPE, FILO_TYPE_ID, IS_DEV_MODE} from "./constants.mjs";
import {filo, getNextTypeId} from "./filo.mjs";
import {wrapFunctionForDev} from "./wrapFunctionForDev.mjs";

const typeDirectory = {}

export function reduceToPrototype(acc, _l) {
  let l = _l
  const layerIsPrecomposed = !!_l[FILO_PROTOTYPE]

  if (layerIsPrecomposed) {
    l = _l[FILO_PROTOTYPE]
  }
  if (!l[FILO_TYPE_ID]) {
    l[FILO_TYPE_ID] = getNextTypeId()
  }
  // if (l[FILO_TYPE_ID] == 210) {debugger}

  // already included, so no need to change anything
  if (acc[FILO_CONSTITUENTS].includes(l[FILO_TYPE_ID])) {
    // no change
    return acc
  }

  if (!typeDirectory[l[FILO_TYPE_ID]]) {
    // todo. decide if lens acess of parent private properties is more important
    typeDirectory[l[FILO_TYPE_ID]] = l
  }
  const next = {
    [FILO_CONSTITUENTS]: [
      ...acc[FILO_CONSTITUENTS],
      l[FILO_TYPE_ID],
    ]
  }

  let recompleInParts = false
  for (const toBeAdded of [...(l[FILO_CONSTITUENTS] || [])]) {
    if (acc[FILO_CONSTITUENTS].includes(toBeAdded)) {
      console.warn('FILO Warning: already added layer by id: ' + toBeAdded + ' in layer: ' + l[FILO_TYPE_ID])
      recompleInParts = true

      // throw new Error('FILO Error: this use-case is not yet supported. Break your layers down and add individually')
      // return acc
    }
  }

  if (recompleInParts) {
    let recompiled = {[FILO_CONSTITUENTS]: []}
    for (const toBeAdded of l[FILO_CONSTITUENTS]) {
      if (!next[FILO_CONSTITUENTS].includes(toBeAdded)) {
        recompiled = reduceToPrototype(recompiled, typeDirectory[toBeAdded])
      }
    }

    // return _next
    l = recompiled
  } //else {
    next[FILO_CONSTITUENTS] = [
      ...next[FILO_CONSTITUENTS],
      ...(l[FILO_CONSTITUENTS] || []),
    ]
  //}


  // todo skip already added


  // const layerType = typeof l // could be function
  if (typeof l == 'function' && !l[FILO_PROTOTYPE]) {
    throw new Error('A layer cannot be a function')
  } else {
    const layerKeys = Object.keys(l)
    const fnKeys = Array.from(
        new Set([...Object.keys(acc), ...layerKeys]).keys()
    ).sort((a,b) => a == 'constructor' ? -1 : (b == 'constructor' ? 1 : 0))
    for (const k of fnKeys) {

      const fn1 = acc[k]
      const _fn2 = l[k]
      // const _fn2 = layerType == 'function' ? l : l[k]

      if (k[0] === k[0].toUpperCase()) {
        // if a Lens is defined in a parent layer,
        // this allows lenses to have access to private properties on their parents

        if (_fn2 && !_fn2[FILO_TYPE_ID]) {
          // todo. do we really want this??
          _fn2[FILO_TYPE_ID] = l[FILO_TYPE_ID]
        }

        // Lenses can be functions that return values and act with classical override
        if (typeof _fn2 == 'function' && !_fn2[FILO_PROTOTYPE]) {
          if (typeof fn1 == 'function' && fn1[FILO_PROTOTYPE]) {
            throw new Error('Lenses must be either a class or a function, mixing is not allowed')
          }
          next[k] = wrapFunctionForDev(k, _fn2, l)
        } else {
          if (fn1 && _fn2) {
            next[k] = filo(fn1, _fn2)
          } else if (fn1 && !_fn2) {
            if (typeof fn1 == 'function' && !fn1[FILO_PROTOTYPE]) {
              next[k] = fn1
            } else {
              next[k] = filo(fn1)
            }
          } else if (_fn2 && !fn1) {
            next[k] = filo(_fn2)
          }
        }

        next[k]._IS_LENS = true

        /* Since this is a lens, we're done */
        continue
      } else {
        // cannot be an object
        if (typeof _fn2 == 'object' && _fn2 != null) {
          throw new Error('Lowercase keys must be a primitive or a function')
        }
        if (_fn2 !== undefined && typeof _fn2 !== 'function') {
          if (_fn2 !== undefined && fn1 !== undefined) {
            throw new Error('Declared defaults cannot change')
          }

          next[FILO_HAS_CONSTRUCTOR] = true
          const constructor = next.constructor
          const setter = wrapFunctionForDev('constructor', function () {
            if (!(k in this)) this[k] = _fn2
          }, l)

          next.constructor = constructor ? function (arg) {
            constructor.call(this, arg)
            setter.call(this)
          } : setter
          // we don't need to change anything else
          continue

        }
      }

      /* Since it's not a lens, wrap the function if in DEV mode */

      const fn2 = wrapFunctionForDev(k, _fn2, l)

      if (k === 'constructor') {
        // constructors cannot be async
        next[FILO_HAS_CONSTRUCTOR] = true

        if (fn1 && fn2) {
          next[k] = function (arg) {
            fn1.call(this, arg)
            fn2.call(this, arg)
          }
        } else if (fn1 && !fn2) {
          next[k] = fn1
        } else if (fn2 && !fn1) {
          next[k] = fn2
        }


      } else if (fn1 && !fn2) {
        next[k] = fn1
      } else if (fn2 && !fn1) {
        next[k] = fn2
      } else {
        next[k] = function (arg) {
          // a specific function must remain sync or async through all layers (DEV mode check)
          const r1 = fn1.call(this, arg)
          if (r1?.then) {
            return r1.then(() => {
              if (IS_DEV_MODE) {
                const r2 = fn2.call(this, arg)
                if (r2?.then) {
                  return r2
                }
                if (!r2?.then || (r2 && typeof r2.then != 'function')) {
                  console.warn(k + '() : Async functions must remain async through all layers. Future versions of filo.js will throw an error')
                }
              } else {
                return fn2.call(this, arg)
              }
            })
          } else {
            // verifying that sync functions don't become async
            if (IS_DEV_MODE) {
              const r2 = fn2.call(this, arg)
              if (r2) return r2
              if (r2?.then || (r2 && typeof r2.then !== 'function')) {
                console.warn(k + '() : Sync functions must remain sync through all layers. Future versions of filo.js will throw an error')
              }
            } else {
              return fn2.call(this, arg)
            }

          }
        }
      }
    }
  }
  // if DEV seal `this` argument

  return next


}