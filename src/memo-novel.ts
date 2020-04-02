import { useEffect, useMemo, useRef, useState } from 'react'
import { isObservable, Subject, Subscription } from 'rxjs'
import { Novel } from './interfaces'
import StateObservable from './StateObservable'

export const NO_VALUE = Symbol('no-value')

export function useMemoNovel<I, S extends object, D extends object, E>(
  input: I,
  initialState: S,
  novel: Novel<I, S, D, E>,
) {
  const [state, setState] = useState(initialState)
  const input$ = useMemo(() => new Subject<I>(), [])
  const state$ = useMemo(() => new Subject<S>(), [])

  // 每次渲染之后更新 input$
  const mount = useRef(true)
  useEffect(() => {
    // 跳过第一次渲染
    if (mount.current) {
      mount.current = false
      return
    }
    input$.next(input)
  })

  const derivedValueRef = useRef<D>(null)
  const exportsRef = useRef<E>(null)
  const subscription = useMemo(() => new Subscription(), [])

  // 用 useMemo 来同步地执行 novel 与订阅 derived$，防止 derived 的初始值丢失
  useMemo(() => {
    const output = novel(
      new StateObservable(input$, input),
      new StateObservable(state$, initialState),
    )
    if (output == null) {
      return
    }

    if (isObservable(output)) {
      subscription.add(
        output.subscribe(value => {
          state$.next(value)
          setState(value)
        }),
      )
    } else {
      subscription.add(
        output.nextState?.subscribe(value => {
          state$.next(value)
          setState(value)
        }),
      )
      if (output.derived) {
        let syncEmittedValue: D | typeof NO_VALUE = NO_VALUE
        subscription.add(
          output.derived.subscribe(value => {
            derivedValueRef.current = value
            /* istanbul ignore else */
            if (process.env.NODE_ENV !== 'production') {
              syncEmittedValue = value
            }
          }),
        )
        /* istanbul ignore else */
        if (process.env.NODE_ENV !== 'production') {
          if (syncEmittedValue === NO_VALUE) {
            throw new Error('derived$ must synchronously emit a value.')
          }
        }
      }
      subscription.add(output.teardown)
      exportsRef.current = output.exports
    }
  }, [])

  useEffect(() => {
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return [{ ...state, ...derivedValueRef.current }, exportsRef.current] as const
}
