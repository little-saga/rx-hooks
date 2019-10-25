import { BehaviorSubject, from } from 'rxjs'
import { map } from 'rxjs/operators'
import { TestScheduler } from 'rxjs/testing'
import { applyMutatorAsReducer, combineLatestFromObject, ofType } from '../operators'


describe('ofType operator', () => {
  const testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected)
  })
  test('one type', () => {
    testScheduler.run(({ expectObservable }) => {
      const obs$ = from([{ type: 'a' }, { type: 'b' }, { type: 'a' }, { type: 'c' }] as const).pipe(
        ofType('a'),
        map(ac => ac.type),
      )
      expectObservable(obs$).toBe('(aa|)')
    })
  })

  test('multiple types', () => {
    testScheduler.run(({ expectObservable }) => {
      const obs$ = from([{ type: 'a' }, { type: 'b' }, { type: 'a' }, { type: 'c' }] as const).pipe(
        ofType('a', 'b'),
        map(ac => ac.type),
      )
      expectObservable(obs$).toBe('(aba|)')
    })
  })
})

describe('combineLatestFromObject operator', () => {
  const testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected)
  })
  test('simple combine', () => {
    testScheduler.run(({ expectObservable, hot }) => {
      const foo$ = hot('-1--2------3--')
      const bar$ = hot('--a-b----c--d-')
      //////////////////--0-(12)-3-45-
      expectObservable(
        combineLatestFromObject({
          foo: foo$,
          bar: bar$,
        }),
      ).toBe('--0-(12)-3-45-', [
        { foo: '1', bar: 'a' },
        { foo: '2', bar: 'a' },
        { foo: '2', bar: 'b' },
        { foo: '2', bar: 'c' },
        { foo: '3', bar: 'c' },
        { foo: '3', bar: 'd' },
      ])
    })
  })
})

describe('applyMutatorAsReducer operator', () => {
  const testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected)
  })

  test('applyMutatorAsReducer for simple counter', () => {
    testScheduler.run(({ expectObservable, cold }) => {
      const state$ = new BehaviorSubject({ count: 0 })
      const action$ = cold('-iii-dd-r-i', { i: 'inc', d: 'dec', r: 'reset' })
      //////////////////////0123-21-0-1
      const nextState$ = action$.pipe(
        applyMutatorAsReducer(state$, (draft, action) => {
          if (action === 'inc') {
            draft.count += 1
          } else if (action === 'dec') {
            draft.count -= 1
          } else if (action === 'reset') {
            draft.count = 0
          } else {
            throw new Error('invalid action')
          }
        }),
      )
      nextState$.subscribe(state$)

      expectObservable(state$).toBe('0123-21-0-1', {
        0: { count: 0 },
        1: { count: 1 },
        2: { count: 2 },
        3: { count: 3 },
      })
    })
  })
})
