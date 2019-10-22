function isEqual<T>(obj1: T, obj2: T, deep: boolean) {
  // 处理基本类型
  if (
    typeof obj1 === 'number' ||
    typeof obj2 === 'number' ||
    typeof obj1 === 'string' ||
    typeof obj2 === 'string' ||
    typeof obj1 === 'bigint' ||
    typeof obj2 === 'bigint' ||
    typeof obj1 === 'boolean' ||
    typeof obj2 === 'boolean' ||
    typeof obj1 === 'function' ||
    typeof obj2 === 'function' ||
    typeof obj1 === 'symbol' ||
    typeof obj2 === 'symbol'
  ) {
    return obj1 === obj2
  }

  // 处理 null 与 undefined，这里我们不对 null/undefined 进行区分
  if (obj1 == null || obj2 == null) {
    return obj1 == obj2
  }

  // 数组
  if (Array.isArray(obj1)) {
    if (!Array.isArray(obj2)) {
      return false
    }
    if (obj1.length !== obj2.length) {
      return false
    }
    for (let i = 0; i < obj1.length; i++) {
      if (deep && !isEqual(obj1[i], obj2[i], deep)) {
        return false
      }
      if (!deep && obj1[i] !== obj2[i]) {
        return false
      }
    }
    return true
  }

  // 普通对象
  const obj1Keys = Object.keys(obj1)
  const obj2Keys = Object.keys(obj2)
  if (obj1Keys.length !== obj2Keys.length) {
    return false
  }
  for (const key of obj1Keys) {
    if (deep && !isEqual(obj1[key], obj2[key], deep)) {
      return false
    }
    if (!deep && obj1[key] !== obj2[key]) {
      return false
    }
  }
  return true
}

export function shallowEqual<T>(obj1: T, obj2: T) {
  return isEqual(obj1, obj2, false)
}

export function deepEqual<T>(obj1: T, obj2: T) {
  return isEqual(obj1, obj2, true)
}
