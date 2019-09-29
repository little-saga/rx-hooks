import produce, { Draft } from 'immer'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  ObservedValueOf,
  OperatorFunction,
  pipe,
  Subject,
  Subscription,
} from 'rxjs'
import { distinct, map, tap, withLatestFrom } from 'rxjs/operators'

/** 打印 observable 中流过的值 */
export function log<V>(label: string, style = 'background: #222; color: #bada55') {
  return pipe(tap<V>(v => console.log(`%c${label}`, style, v)))
}

/** 从变化的 value 中创建一个 BehaviorSubject
 * 该 hooks 会使用 useEffect 来 BehaviorSubject 中的最新值为传入的 value */
export function useMimicBehaviorSubject<S>(value: S) {
  const subject$ = useBehaviorSubject(value)
  const mount = useRef(true)
  useEffect(() => {
    // 跳过第一次渲染
    if (mount.current) {
      mount.current = false
      return
    }
    subject$.next(value)
  })
  return subject$
}

/** 获取一个新的 Subject */
export function useSubject<S>() {
  return useMemo(() => new Subject<S>(), [])
}

/** 获取一个新的 BehaviorSubject */
function useBehaviorSubject<S>(initialState: S) {
  return useMemo(() => new BehaviorSubject<S>(initialState), [])
}

export type Fiction<S, D, E> = (
  state$: Observable<S>,
) => {
  nextState?: Observable<S>
  derived?: Observable<D>
  exports?: E
  teardown?(): void
}

export function useFiction<S extends object, D, E>(
  fiction: Fiction<S, D, E>,
  initialState: S | (() => S),
): readonly [S & D, E] {
  const [state, setState] = useState(initialState)
  const state$ = useBehaviorSubject(state)
  const derivedValueRef = useRef<D>(null)
  const exportsRef = useRef<E>(null)
  const ref = useRef<{
    derivationSubscription: Subscription
    nextStateSubscription: Subscription
    teardown?(): void
  }>({} as any)

  // 用 useMemo 来同步地执行 story 与订阅 derived$，防止 derived 的初始值丢失
  useMemo(() => {
    const { derived: derived$, exports, nextState: nextState$, teardown } = fiction(state$)
    exportsRef.current = exports
    ref.current.teardown = teardown
    if (derived$) {
      ref.current.derivationSubscription = derived$.subscribe(value => {
        derivedValueRef.current = value
      })
    }
    if (nextState$) {
      ref.current.nextStateSubscription = nextState$.subscribe(value => {
        state$.next(value)
        setState(value)
      })
    }
  }, [])

  useEffect(() => {
    return () => {
      const { derivationSubscription, nextStateSubscription, teardown } = ref.current
      if (derivationSubscription) {
        derivationSubscription.unsubscribe()
      }
      if (nextStateSubscription) {
        nextStateSubscription.unsubscribe()
      }

      state$.complete()
      if (teardown) {
        teardown()
      }
    }
  }, [])

  return [{ ...state, ...derivedValueRef.current }, exportsRef.current] as const
}

export function applyMutatorAsReducer<S, A>(
  state$: Observable<S>,
  mutator: (draft: Draft<S>, action: A, state: S) => void,
): OperatorFunction<A, S> {
  return pipe(
    withLatestFrom(state$),
    map(([action, state]) =>
      produce(state, draft => {
        mutator(draft, action, state)
      }),
    ),
  )
}

export function combineLatestFromObject<T extends { [key: string]: Observable<any> }>(
  dict: T,
): Observable<{ [key in keyof T]: ObservedValueOf<T[key]> }> {
  const keys = Object.keys(dict)
  const observables = Object.values(dict)
  return combineLatest(observables).pipe(
    map(values => Object.fromEntries(values.map((v, i) => [keys[i], v]))),
  ) as any
}

export type RxNovel<P extends object, S extends object, D, E> = (
  props$: Observable<P>,
  state$: Observable<S>,
) => {
  nextState?: Observable<S>
  derived?: Observable<D>
  exports?: E
  teardown?(): void
}
export function useRxNovel<P extends object, S extends object, D, E>(
  props: P,
  getInitState: (props: P) => S,
  novel: RxNovel<P, S, D, E>,
) {
  const props$ = useMimicBehaviorSubject(props)
  return useFiction(state$ => novel(props$, state$), () => getInitState(props))
}

export function distinctMap<T, R>(project: (value: T, index: number) => R): OperatorFunction<T, R> {
  return pipe(
    map(project),
    distinct(),
  )
}

export class SubjectProxy<T> extends Subject<T> {
  constructor(readonly subscription: Subscription) {
    super()
  }

  imitate(target$: Observable<T>) {
    this.subscription.add(target$.subscribe(this))
  }
}

export function isEqual<T>(obj1: T, obj2: T, deep = false) {
  if (obj1 === obj2) {
    return true
  }

  if (obj1 == null || obj2 == null) {
    return false
  }

  if (Array.isArray(obj1)) {
    if (!Array.isArray(obj2)) {
      return false
    }
    if (obj1.length !== obj2.length) {
      return false
    }
    for (let i = 0; i < obj1.length; i++) {
      if (deep && !isEqual(obj1[i], obj2[i], deep)) {
        return false
      }
      if (!deep && obj1[i] !== obj2[i]) {
        return false
      }
    }
    return true
  }

  for (const key of Object.keys(obj1)) {
    if (deep && !isEqual(obj1[key], obj2[key], deep)) {
      return false
    }
    if (!deep && obj1[key] !== obj2[key]) {
      return false
    }
  }
  return true
}

export const shallowEqual = isEqual

export function deepEqual<T>(obj1: T, obj2: T) {
  return isEqual(obj1, obj2, true)
}
