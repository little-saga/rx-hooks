import { from } from 'rxjs'
import { map } from 'rxjs/operators'
import { TestScheduler } from 'rxjs/testing'
import { ofType, combineLatestFromObject } from '../operators'

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

// todo
// describe('applyMutatorAsReducer operator', () => {
// })
