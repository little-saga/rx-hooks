# @little-saga/rx-hooks

[![Build Status](https://img.shields.io/travis/little-saga/rx-hooks/master.svg?style=flat-square)](https://travis-ci.org/little-saga/rx-hooks) [![Coverage Status](https://img.shields.io/coveralls/little-saga/rx-hooks/master.svg?style=flat-square)](https://coveralls.io/github/little-saga/rx-hooks?branch=master) [![NPM Package](https://img.shields.io/npm/v/@little-saga/rx-hooks.svg?style=flat-square)](https://www.npmjs.org/package/@little-saga/rx-hooks)

更好用的 RxJS+React hooks 集成方案。以及一些好用的工具函数！

## Why

https://zhuanlan.zhihu.com/p/92248348

## `Novel`

在 @little-saga/rx-hooks，Novel 是一种满足特定接口的函数。开发者将自定义的逻辑封装为相应的 novel，然后调用 useNovel 函数，使 novel 运行在一个 React 组件的生命周期内（基于 React hooks 机制）。

Novel 内的逻辑一般采用 RxJS 编程，@little-saga/rx-hooks 不对 novel 内部的逻辑进行限制，开发者可以选用自己熟悉的 RxJS 开发方式。而 Novel 的输入/输出（即函数的参数和返回值）则需要满足下面描述的要求。

### TypeScript 类型表示

```typescript
type Novel<I, S extends object, D extends object, E> = (
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
```

### Novel 输入要求

- novel 函数的参数用来抽象 `React -> RxJS` 的通信过程
- novel 函数被调用时，调用参数为 `input$` 和 `state$`
  - input\$ 表示 React 当前向 novel 提供的输入，其类型为 `BehaviorSubject<I>`
  - 每次组件的 render 方法被执行时，input\$ 中就会发出组件最新提供的值；值对应于 `useNovel(input, initState, novel)` 中的 input 参数
  - 「input\$ 之于 novel」相当于「props 之于 React 组件」；input\$ 应当被认为是只读的
  - state\$ 表示 novel 绑定到 React 组件的当前状态；其背后对应一个 useState hook
  - 每次组件的 render 方法被执行时，novel 就可以通过 state\$ 获取到最新的状态

### Novel 输出要求

- novel 函数的返回值用来抽象 `RxJS -> React` 的通信过程
- novel 的返回值一般为一个对象，对象中各个字段的含义如下
  - nextState：用于表示下一个状态的 Observable. 每当该 Observable 发出一个值的时候，对应的 useState hook 的 setState 方法将被调用，组件将重新渲染
  - derived: 用于表示缓存/计算状态的 Observable. useNovel 的返回值中会包含该 Observable 的最新的值；该 Observable 发出值的时候不会触发渲染
  - exports: 对象导出，使得 React 组件可以获取到 novel 内部的对象
  - teardown: 清理逻辑，当组件被卸载时，该函数将被调用
- novel 的返回值也可以是一个简单的 Observable，此时该 Observable 的作用与 nextState 字段相同。

## API

### `useNovel(input: I, initState: S, novel: Novel<I, S, D, E>) => [S & D, E]`

泛型参数说明:

- `I` input 参数的类型
- `S` state 参数的类型
- `D` novel 返回值中 derived 字段的类型
- `E` novel 返回值中 exports 字段的类型

useNovel 将在一个 React 组件内执行 novel 函数，并将 novel 的输入输出与 React 组件绑定起来。注意 useNovel 是一个 React hooks，调用该函数需要遵循 [hooks rules](https://zh-hans.reactjs.org/docs/hooks-rules.html).

useNovel 会返回一个数组，数组的长度固定为 2，第一个元素是 state 与 derived 两个对象的合并结果，第二个元素即为 novel 返回对象的 exports 字段。
