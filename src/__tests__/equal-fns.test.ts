import { deepEqual, shallowEqual } from '../equal-fns'

test('primitives shallowEqual', () => {
  expect(shallowEqual(1, 1)).toBe(true)
  expect(shallowEqual(1, 10)).toBe(false)

  expect(shallowEqual('foo', 'foo')).toBe(true)
  expect(shallowEqual('foo', 'bar')).toBe(false)

  expect(shallowEqual(true, true)).toBe(true)
  expect(shallowEqual(true, false)).toBe(false)

  const fn1 = () => {}
  const fn2 = () => {}
  expect(shallowEqual(fn1, fn1)).toBe(true)
  expect(shallowEqual(fn1, fn2)).toBe(false)

  const symbol1 = Symbol('s1')
  expect(shallowEqual(symbol1, symbol1)).toBe(true)

  expect(shallowEqual(null, null)).toBe(true)
  expect(shallowEqual(null, undefined)).toBe(true)

  expect(shallowEqual(null, {})).toBe(false)
  expect(shallowEqual([] as any, 1)).toBe(false)
  expect(shallowEqual({} as any, 1)).toBe(false)
})

test('object shallowEqual', () => {
  const obj1 = { foo: 1, bar: 2 }
  const obj1_copy = { foo: 1, bar: 2 }
  const obj2 = { buzz: 3 }
  expect(shallowEqual(obj1, obj1_copy)).toBe(true)
  expect(shallowEqual(obj1, obj2 as any)).toBe(false)
  expect(shallowEqual({}, {})).toBe(true)
})

test('array shallowEqual', () => {
  const arr1 = [1, 2, 3, 4]
  expect(shallowEqual(arr1, arr1.slice())).toBe(true)
  expect(shallowEqual(arr1, [4, 3, 2, 1])).toBe(false)
  expect(shallowEqual(arr1, [1, 1, 1])).toBe(false)
  expect(shallowEqual([], [])).toBe(true)
})

test('object deepEqual', () => {
  const obj1 = { foo: 1, bar: { typescript: 1, jest: 2 } }
  const obj2 = { bar: { jest: 2, typescript: 1 }, foo: 1 }
  expect(shallowEqual(obj1, obj2)).toBe(false)
  expect(deepEqual(obj1, obj2)).toBe(true)
})

test('array deepEqual', () => {
  const arr1 = [{ test: 1, just: 2, wonderful: { foo: { bar: { buzz: false } } } }]
  const arr2 = [{ test: 1, just: 2, wonderful: { foo: { bar: { buzz: false } } } }]

  expect(shallowEqual(arr1, arr2)).toBe(false)
  expect(deepEqual(arr1, arr2)).toBe(true)
})

test('object with extra fields', () => {
  const obj1 = { foo: 1, bar: 2 }
  const obj2 = { foo: 1, bar: 2, buzz: 3 }
  expect(shallowEqual(obj1, obj2)).toBe(false)
  expect(deepEqual(obj1, obj2)).toBe(false)
})

test('object with different field value', () => {
  const obj1 = { foo: 1, bar: false }
  const obj2 = { foo: 1, bar: 'buzz' }
  expect(shallowEqual(obj1, obj2 as any)).toBe(false)
  expect(deepEqual(obj1, obj2 as any)).toBe(false)
})
