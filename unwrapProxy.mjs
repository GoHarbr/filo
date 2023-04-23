import {FILO_PROXY_TARGET} from "./constants.mjs";

export function unwrapProxy (what) {
  return what[FILO_PROXY_TARGET] || what
}