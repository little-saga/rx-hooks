export { deepEqual, shallowEqual } from './equal-fns'
export { SubjectProxy } from './helpers'
export { combineLatestFromObject, applyMutatorAsReducer, log, ofType } from './operators'
export { default as StateObservable } from './StateObservable'
export { Novel} from './interfaces'
export { useMemoNovel } from './memo-novel'
export { useEffectNovel } from './effect-novel'
export { NO_VALUE } from './memo-novel'

import { useMemoNovel } from './memo-novel'

/** @deprecated Use {useMemoNovel} instead */
export const useNovel = useMemoNovel
