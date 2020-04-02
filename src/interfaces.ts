import { Observable } from 'rxjs'
import StateObservable from './StateObservable'

export type Novel<I, S extends object, D extends object, E> = (
  input$: StateObservable<I>,
  state$: StateObservable<S>,
) =>
  | Observable<S>
  | {
      nextState?: Observable<S>
      derived?: Observable<D>
      exports?: E
      teardown?(): void
    }
