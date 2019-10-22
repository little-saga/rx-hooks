import { Observable, Subject, Subscription } from 'rxjs'

export class SubjectProxy<T> extends Subject<T> {
  constructor(readonly subscription: Subscription) {
    super()
  }

  imitate(target$: Observable<T>) {
    this.subscription.add(target$.subscribe(this))
  }

  loop(fn: (input$: Observable<T>) => Observable<T>) {
    this.imitate(fn(this))
  }
}
