import {FILO_CONSTITUENTS, FILO_PROTOTYPE, FILO_TYPE_ID} from "./constants.mjs";

export function cast(what, toType, doThrow) {
  const searchFor = toType[FILO_PROTOTYPE][FILO_TYPE_ID]
  if (!what) return null

  if (what[FILO_CONSTITUENTS]?.includes(searchFor) || what[FILO_TYPE_ID] === searchFor) {
    return what
  } else {
    if (doThrow) throw new Error('Failed to cast')

    return null
  }
}