import { filter, map } from 'rxjs/operators'
import { SubjectProxy } from '../helpers'
import { Subject, Subscription } from 'rxjs'

test('SubjectProxy#imitate', () => {
  const subscription = new Subscription()
  const subjectProxy$ = new SubjectProxy(subscription)
  const source$ = new Subject<any>()
  const collect: any[] = []

  subjectProxy$.imitate(source$)

  subjectProxy$.subscribe(value => {
    collect.push(value)
  })

  // before unsubscribe
  source$.next(1)
  source$.next(2)
  source$.next(3)

  subscription.unsubscribe()

  // after unsubscribe
  source$.next(4)
  source$.next(5)

  expect(collect).toEqual([1, 2, 3])
})

test('SubjectProxy#loop', () => {
  const subscription = new Subscription()
  const subjectProxy$ = new SubjectProxy(subscription)
  const collect: any[] = []
  subjectProxy$.subscribe(value => {
    collect.push(value)
  })

  subjectProxy$.loop(input$ =>
    input$.pipe(
      filter(x => x > 0),
      map(x => -x),
    ),
  )

  // before unsubscribe
  subjectProxy$.next(1)
  subjectProxy$.next(2)
  subjectProxy$.next(3)

  subscription.unsubscribe()

  // after unsubscribe
  subjectProxy$.next(4)
  subjectProxy$.next(5)

  expect(collect).toEqual([1, -1, 2, -2, 3, -3, 4, 5])
})
