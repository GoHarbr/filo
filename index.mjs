/**
 * Filo.
 *
 * Inspired by the best and smallest parts of `layer-compose`.
 * This is it. These are the best parts.
 * Fit into one file (well, used to before additional development checks)
 *
 * Authorship: Anton Kats
 * Copyleft: absolutely free for any use with no warranties, as long as the derivative work remains copyleft
 *
 * Upcoming features:
 * - Full swap through global layer by id registry
 * - Check that constructors are not async
 * - Prevent `push`, `add`, setting of keys from layers that don't own the object
 *
 * Features completed:
 * - Sync functions must remain sync through all layers
 * - Lenses can be specified as functions that return (classical override) (NOV 2022)
 * */

import {filo} from "./filo.mjs"
import {copy} from './copy.mjs'
import prototype from './prototype.mjs'
import {parent} from "./filo.mjs";
import {constructor} from "./constructor.mjs";
import {cast} from "./cast.mjs"
import {inject} from "./inject.mjs";
import {unwrapProxy} from "./unwrapProxy.mjs";

export {filo, copy, parent, prototype, inject, constructor, cast, unwrapProxy}