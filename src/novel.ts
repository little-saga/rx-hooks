import { useEffect, useMemo, useRef, useState } from 'react'
import { BehaviorSubject, isObservable, Observable, Subscription } from 'rxjs'

const NO_VALUE = Symbol('no-value')

export type Novel<I, S extends object, D extends object, E> = (
  input$: Observable<I>,
  state$: Observable<S>,
) =>
  | Observable<S>
  | {
      nextState?: Observable<S>
      derived?: Observable<D>
      exports?: E
      teardown?(): void
    }

export function useNovel<I, S extends object, D extends object, E>(
  input: I,
  initialState: S,
  novel: Novel<I, S, D, E>,
) {
  const [state, setState] = useState(initialState)
  const input$ = useMemo(() => new BehaviorSubject(input), [])
  const state$ = useMemo(() => new BehaviorSubject(state), [])

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
  const ref = useRef<{
    deriveSub: Subscription
    stateSub: Subscription
    teardown?(): void
  }>({} as any)

  // 用 useMemo 来同步地执行 novel 与订阅 derived$，防止 derived 的初始值丢失
  useMemo(() => {
    const output = novel(input$, state$)
    if (output == null) {
      return
    }

    if (isObservable(output)) {
      ref.current.stateSub = output.subscribe(value => {
        state$.next(value)
        setState(value)
      })
    } else {
      // 注意这里 ?. 操作符的使用
      ref.current.stateSub = output.nextState?.subscribe(value => {
        state$.next(value)
        setState(value)
      })
      if (output.derived) {
        let syncEmittedValue: D | typeof NO_VALUE = NO_VALUE
        ref.current.deriveSub = output.derived.subscribe(value => {
          derivedValueRef.current = value
          if (process.env.NODE_ENV !== 'production') {
            syncEmittedValue = value
          }
        })
        if (process.env.NODE_ENV !== 'production') {
          if (syncEmittedValue === NO_VALUE) {
            throw new Error('derived$ must synchronously emit a value.')
          }
        }
      }
      ref.current.teardown = output.teardown
      exportsRef.current = output.exports
    }
  }, [])

  useEffect(() => {
    return () => {
      state$.complete()
      // 注意这里 ?. 操作符的使用
      ref.current.teardown?.()
      ref.current.deriveSub?.unsubscribe()
      ref.current.stateSub?.unsubscribe()
    }
  }, [])

  return [{ ...state, ...derivedValueRef.current }, exportsRef.current] as const
}
