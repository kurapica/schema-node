/**
 * is null
 */
export function isNull(value: any)
{
  return value == null || value == undefined || value === ""
}

/**
 * Gets the value by path
 */
export function getvaluebypath(value: any, path: string)
{
  const paths = path ? path.split(".") : []
  for (let i = 0; i < paths.length; i++)
  {
    if (typeof (value) !== "object") return null
    value = value[paths[i]]
  }
  return value
}

/**
 * Debounce function
 * @param fn
 * @param wait
 */
export function debounce(fn: Function, wait: number)
{
  let timer:any = 0
  return function (...args: any[])
  {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
}

export function debounceby(fn: Function, wait: Function)
{
  let timer:any = 0
  return function (...args: any[])
  {
    if (timer) {
      clearTimeout(timer)
      timer = 0
    }
    const waiter = wait()
    if(waiter)
    {
      timer = setTimeout(() => fn(...args), waiter)
    }
    else
    {
      fn(...args)
    }
  }
}

/**
 * Check is equal
 */
export function isEqual(a: any, b: any, t: string | null = null) {
  // For date
  if (t === "system.date" || t === "system.fulldate" || t === "system.yearmonth") {
    if (a instanceof Date)
    {
      // Pass
    }
    else if (typeof (a) === "string" || typeof(a) === "number")
    {
      a = new Date(a)
      if (isNaN(a.getFullYear())) a = null
    }
    else
    {
      a = null
    }

    if (b instanceof Date)
    {
      // Pass
    }
    else if (typeof (b) === "string" || typeof(b) === "number")
    {
      b = new Date(b)
      if (isNaN(b.getFullYear())) b = null
    }
    else
    {
      b = null
    }

    if(a && b)
    {
      if(t === "system.yearmonth")
      {
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
      }
      else if(t === "system.fulldate")
      {
        return a.toISOString() === b.toISOString()
      }
      else
      {
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
      }
    }
  }

  // Common
  if (a instanceof Date && b instanceof Date)
  {
    return a.getTime() === b.getTime()
  }
  return a === b
}

/**
 * Wrap a function so the same query will not be executed multiple times
 */
export function useShareQuery<T>(queryFunc: (...args:any[]) => Promise<T>)
{
  const querys: {
    [key: string]: {
      args: any[],
      querys: {
        resolve: Function,
        reject: Function
      }[]
    }
  } = {}
  const process: { [key: string]: boolean } = {}
  const querymap:any = {}

  const processQuery = (key: string) =>
  {
    if (!querys[key] || process[key] || querys[key].querys.length === 0) return
    process[key] = true

    // Already done
    if (querymap[key] !== null && querymap[key] !== undefined)
    {
      querys[key].querys.forEach(q => q.resolve(querymap[key]))
      delete querys[key]
      delete process[key]
    }

    // Process
    queryFunc(...querys[key].args)
      .then(res => {
        querymap[key] = res
        querys[key].querys.forEach(q => q.resolve(res))
      })
      .catch(ex => {
        querys[key].querys.forEach(q => q.reject(ex))
      })
      .finally(() => {
        delete querys[key]
        delete process[key]
      })
  }

  return function (...args: any[]) {
    const key = JSON.stringify(args)

    // Delay to process
    setTimeout(() => processQuery(key), 10);
    return new Promise((resolve, reject) => {
      if (querymap[key]) return resolve(querymap[key])

      // Queue
      querys[key] = querys[key] || { args, querys: [] }
      querys[key].querys.push({ resolve, reject })
    }) as unknown as Promise<T>
  }
}

//#endregion

//#region Queue query

/**
 * Use queue to process query
 */
export function useQueueQuery<T>(queryFunc: (...args: any[]) => Promise<T>)
{
  const queues: {
    args: any[],
    resolve: Function,
    reject: Function
  }[] = []
  let processing = 0

  const processQuery = async () => {
    // 单执行-记录时间，避免卡死影响后续调度
    if (processing && (new Date().getTime() - processing) < 1000) return

    // 循环执行
    let task = queues.shift()
    while (task) {
      processing = new Date().getTime()
      try {
        task.resolve(await queryFunc(...task.args))
      }
      catch (ex) {
        task.reject(ex)
      }
      task = queues.shift()
    }

    // 重置交给下次执行
    processing = 0
  }

  return function (...args: any[])
  {
    setTimeout(() => processQuery(), 5)
    return new Promise((resolve, reject) => queues.push({ args, resolve, reject })) as unknown as Promise<T>
  }
}

//#endregion

//#region utility

/**
 * deep clone
 */
export function deepClone(value: any): any
{
  if (Array.isArray(value))
  {
    return value.map(deepClone)
  }
  else if (typeof (value) === "object")
  {
    const ret:any = {}
    for (var k in value)
    {
      ret[k] = deepClone(value[k])
    }
    return ret
  }
  else
  {
    return value
  }
}
