export class EventBus {
    /** @type {Map<string, Set<Function>>} */
    #listeners = new Map()

    /** @type {boolean} */
    #debug

    /**
     * @param {object} [options]
     * @param {boolean} [options.debug=false]
     */
    constructor({ debug = false } = {}) {
        this.#debug = debug
    }

    /**
     * Subscribe to an event. Returns an unsubscribe function.
     * @param {string} event
     * @param {Function} handler
     * @returns {() => void}
     */
    on(event, handler) {
        if (typeof handler !== 'function') {
            throw new TypeError(`Handler must be a function, got ${typeof handler}`)
        }

        if (!this.#listeners.has(event)) {
            this.#listeners.set(event, new Set())
        }

        this.#listeners.get(event).add(handler)

        return () => this.off(event, handler)
    }

    /**
     * Unsubscribe from an event.
     * @param {string} event
     * @param {Function} handler
     */
    off(event, handler) {
        const set = this.#listeners.get(event)
        if (!set) return

        set.delete(handler)

        if (set.size === 0) {
            this.#listeners.delete(event)
        }
    }

    /**
     * Subscribe once — handler is removed after first call.
     * @param {string} event
     * @param {Function} handler
     * @returns {() => void}
     */
    once(event, handler) {
        if (typeof handler !== 'function') {
            throw new TypeError(`Handler must be a function, got ${typeof handler}`)
        }

        const wrapper = (...args) => {
            this.off(event, wrapper)
            handler(...args)
        }

        return this.on(event, wrapper)
    }

    /**
     * Emit an event with optional data.
     * @param {string} event
     * @param {...*} args
     */
    emit(event, ...args) {
        if (this.#debug) {
            console.log(`[EventBus] emit: ${event}`, ...args)
        }

        const handlers = this.#listeners.get(event)
        if (!handlers) return

        for (const handler of [...handlers]) {
            try {
                handler(...args)
            } catch (err) {
                console.error(`[EventBus] Error in handler for "${event}":`, err)
            }
        }
    }

    /**
     * Remove all listeners, optionally for a specific event.
     * @param {string} [event]
     */
    clear(event) {
        if (event !== undefined) {
            this.#listeners.delete(event)
        } else {
            this.#listeners.clear()
        }
    }

    /**
     * Check if an event has any listeners.
     * @param {string} event
     * @returns {boolean}
     */
    has(event) {
        return this.#listeners.has(event)
    }
}
