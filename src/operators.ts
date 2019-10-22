import produce, { Draft } from 'immer'
import { combineLatest, Observable, ObservedValueOf, OperatorFunction, pipe } from 'rxjs'
import { distinct, filter, map, tap, withLatestFrom } from 'rxjs/operators'

/** 打印 observable 中流过的值 */
export function log<V>(label: string, style = 'background: #222; color: #bada55') {
  return pipe(tap<V>(v => console.log(`%c${label}`, style, v)))
}

type ElementOf<T> = T extends (infer E)[] ? E : T
type OfType<AC extends { type: string }, TYPES extends AC['type'][]> = AC extends {
  type: ElementOf<TYPES>
}
  ? AC
  : never

/** 根据 type 字段过滤 action */
export function ofType<
  T extends { type: string },
  TYPES extends T['type'][],
  R extends OfType<T, TYPES>
>(...types: TYPES) {
  const typeSet = new Set(types)
  return filter(action => typeSet.has(action.type)) as OperatorFunction<T, R>
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
