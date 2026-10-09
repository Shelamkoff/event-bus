export class EventBus {
  /** @type {Map<string, Map<Function | symbol, { handler: Function, once: boolean, fired: boolean }>>} */
  #listeners = new Map()

  /** @type {boolean} */
  #debug

  /**
   * @param {object} [options]
   * @param {boolean} [options.debug=false]
   */
  constructor({ debug = false } = {}) {
    if (typeof debug !== 'boolean') throw new TypeError('debug must be a boolean')
    this.#debug = debug
  }

  /** @returns {() => void} */
  on(event, handler) {
    this.#assertEventName(event)
    this.#assertHandler(handler)
    return this.#subscribe(event, handler, handler, false)
  }

  off(event, handler) {
    this.#assertEventName(event)
    this.#assertHandler(handler)
    const listeners = this.#listeners.get(event)
    if (!listeners) return

    for (const [key, subscription] of listeners) {
      if (subscription.handler === handler) this.#remove(event, key, subscription)
    }
  }

  /** @returns {() => void} */
  once(event, handler) {
    this.#assertEventName(event)
    this.#assertHandler(handler)
    return this.#subscribe(event, Symbol(), handler, true)
  }

  emit(event, ...args) {
    this.#assertEventName(event)
    if (this.#debug) {
      try {
        console.log(`[EventBus] emit: ${event}`, ...args)
      } catch {
        // A failing debug logger must not prevent dispatch.
      }
    }

    const listeners = this.#listeners.get(event)
    if (!listeners) return

    for (const [key, subscription] of [...listeners]) {
      if (subscription.once) {
        if (subscription.fired) continue
        subscription.fired = true
        this.#remove(event, key, subscription)
      }

      try {
        // Copy to a local so callbacks have the same undefined receiver as before.
        const handler = subscription.handler
        const result = handler(...args)
        if (result && typeof result.then === 'function') {
          Promise.resolve(result).catch(error => {
            this.#reportError(event, error, true)
          })
        }
      } catch (error) {
        this.#reportError(event, error, false)
      }
    }
  }

  clear(event) {
    if (event !== undefined) {
      this.#assertEventName(event)
      this.#listeners.delete(event)
    } else {
      this.#listeners.clear()
    }
  }

  has(event) {
    this.#assertEventName(event)
    return this.#listeners.has(event)
  }

  #subscribe(event, key, handler, once) {
    let listeners = this.#listeners.get(event)
    if (!listeners) {
      listeners = new Map()
      this.#listeners.set(event, listeners)
    }

    // Repeated on(event, sameHandler) shares one registration. once() is independent.
    let subscription = listeners.get(key)
    if (!subscription) {
      subscription = { handler, once, fired: false }
      listeners.set(key, subscription)
    }

    // Only the captured registration may be removed by this disposer.
    return () => this.#remove(event, key, subscription)
  }

  #remove(event, key, subscription) {
    const listeners = this.#listeners.get(event)
    if (!listeners || listeners.get(key) !== subscription) return
    listeners.delete(key)
    if (listeners.size === 0) this.#listeners.delete(event)
  }

  #reportError(event, error, async) {
    try {
      const kind = async ? 'async handler' : 'handler'
      console.error(`[EventBus] Error in ${kind} for "${event}":`, error)
    } catch {
      // Reporting failures must not interrupt dispatch or reject the catch handler.
    }
  }

  #assertEventName(event) {
    if (typeof event !== 'string' || event.length === 0) {
      throw new TypeError('Event name must be a non-empty string')
    }
  }

  #assertHandler(handler) {
    if (typeof handler !== 'function') {
      throw new TypeError(`Handler must be a function, got ${typeof handler}`)
    }
  }
}
