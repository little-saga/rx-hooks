import { act, renderHook } from '@testing-library/react-hooks'
import { combineLatest, interval, isObservable, NEVER, Observable, Subscription } from 'rxjs'
import { map, startWith, switchMap } from 'rxjs/operators'
import { SubjectProxy } from '../helpers'
import { StateObservable } from '../index'
import { useNovel } from '../novel'
import { applyMutatorAsReducer } from '../operators'

describe('simpleCounterNovel', () => {
  function simpleCounterNovel(
    input$: StateObservable<{ initCount: number }>,
    state$: StateObservable<{ count: number }>,
  ) {
    const subscription = new Subscription()
    const actionProxy$ = new SubjectProxy<string>(subscription)
    const nextState$ = input$.pipe(
      switchMap(({ initCount }) =>
        actionProxy$.pipe(
          applyMutatorAsReducer(state$, (draft, action) => {
            if (action === 'inc') {
              draft.count += 1
            } else if (action === 'dec') {
              draft.count -= 1
            } else if (action === 'reset') {
              draft.count = initCount
            } else {
              throw new Error('Invalid action')
            }
          }),
        ),
      ),
    )
    const dispatch = (action: string) => actionProxy$.next(action)
    const derived$ = combineLatest([state$, actionProxy$.pipe(startWith('init'))]).pipe(
      map(([{ count }, action]) => ({ count, action })),
    )

    return {
      nextState: nextState$,
      derived: derived$,
      exports: { actionProxy$, dispatch },
    }
  }

  test('simple inc/dec/reset case', () => {
    const { result } = renderHook(
      ({ initCount }: { initCount: number }) =>
        useNovel({ initCount }, { count: 0 }, simpleCounterNovel),
      { initialProps: { initCount: 0 } },
    )

    const [_, { dispatch }] = result.current
    expect(result.current[0].count).toBe(0)

    act(() => {
      dispatch('inc')
    })
    expect(result.current[0].count).toBe(1)

    act(() => {
      dispatch('inc')
    })
    expect(result.current[0].count).toBe(2)

    act(() => {
      dispatch('dec')
    })
    expect(result.current[0].count).toBe(1)

    act(() => {
      dispatch('reset')
    })
    expect(result.current[0].count).toBe(0)
  })

  test('derived and exports', () => {
    const { result } = renderHook(
      ({ initCount }: { initCount: number }) =>
        useNovel({ initCount }, { count: 0 }, simpleCounterNovel),
      { initialProps: { initCount: 0 } },
    )

    const [_, { actionProxy$, dispatch }] = result.current

    expect(isObservable(actionProxy$)).toBe(true)
    expect(typeof dispatch).toBe('function')
    expect(result.current[0]).toEqual({ count: 0, action: 'init' })

    act(() => {
      dispatch('inc')
    })
    expect(result.current[0]).toEqual({ count: 1, action: 'inc' })

    act(() => {
      dispatch('reset')
    })
    expect(result.current[0]).toEqual({ count: 0, action: 'reset' })
  })
})

test('derived$ not emitting a value synchronously should throw', () => {
  function flawNovel() {
    return {
      nextState: NEVER,
      derived: NEVER,
    }
  }

  const { result } = renderHook(() => useNovel(null, null, flawNovel))

  expect(result.error.message).toMatch('derived$ must synchronously emit a value.')
})

test('novel directly return nextState$ and novel should unsubscribe when unmount', async () => {
  let unsubscribed = false

  function novel() {
    return new Observable<{ count: number }>(subscriber => {
      const subscription = interval(10)
        .pipe(map(i => ({ count: i + 1 })))
        .subscribe(subscriber)

      return () => {
        unsubscribed = true
        subscription.unsubscribe()
      }
    })
  }

  const { result, unmount, waitForNextUpdate } = renderHook(() =>
    useNovel(null, { count: 0 }, novel),
  )

  expect(result.current[0].count).toBe(0)
  await waitForNextUpdate()
  expect(result.current[0].count).toBe(1)
  await waitForNextUpdate()
  expect(result.current[0].count).toBe(2)
  await waitForNextUpdate()
  expect(result.current[0].count).toBe(3)

  expect(unsubscribed).toBe(false)
  unmount()
  expect(unsubscribed).toBe(true)
})

test('novel should call teardown() when unmount', () => {
  const teardown = jest.fn()
  function novel() {
    return {
      teardown,
    }
  }

  const { unmount } = renderHook(() => useNovel(null, null, novel))

  expect(teardown).not.toBeCalled()
  unmount()
  expect(teardown).toBeCalled()
})
