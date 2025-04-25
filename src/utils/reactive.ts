type Watcher = (path: string, value: any) => void

function deepReactive<T extends object>(target: T, onChange: Watcher, path = ''): T {
  const handler: ProxyHandler<any> = {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver)

      // 递归包装子对象
      if (typeof value === 'object' && value !== null) {
        const fullPath = path ? `${path}.${String(key)}` : String(key)
        return deepReactive(value, onChange, fullPath)
      }

      return value
    },

    set(target, key, value, receiver) {
      const fullPath = path ? `${path}.${String(key)}` : String(key)
      const result = Reflect.set(target, key, value, receiver)
      onChange(fullPath, value)
      return result
    },

    deleteProperty(target, key) {
      const fullPath = path ? `${path}.${String(key)}` : String(key)
      const result = Reflect.deleteProperty(target, key)
      onChange(fullPath, undefined)
      return result
    }
  }

  return new Proxy(target, handler)
}
