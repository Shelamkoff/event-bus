export interface EventBusOptions {
    /** Log every emit to console. Default: false */
    debug?: boolean
}

type EventMap = Record<string, any[]>

type Handler<T extends any[] = any[]> = (...args: T) => void

/**
 * Typed event bus.
 *
 * @example
 * // Untyped (any events, any args)
 * const bus = new EventBus()
 *
 * @example
 * // Typed events
 * type Events = {
 *     'user:login': [id: string, role: string]
 *     'user:logout': []
 *     'error': [error: Error]
 * }
 * const bus = new EventBus<Events>()
 * bus.on('user:login', (id, role) => {})  // id: string, role: string
 * bus.emit('user:login', '42', 'admin')   // ✓
 * bus.emit('user:login', 42)              // ✗ type error
 */
export class EventBus<Events extends EventMap = Record<string, any[]>> {
    constructor(options?: EventBusOptions)

    /**
     * Subscribe to an event. Returns an unsubscribe function.
     */
    on<E extends keyof Events & string>(
        event: E,
        handler: Handler<Events[E]>,
    ): () => void

    /**
     * Unsubscribe from an event.
     */
    off<E extends keyof Events & string>(
        event: E,
        handler: Handler<Events[E]>,
    ): void

    /**
     * Subscribe once — handler is removed after first call.
     */
    once<E extends keyof Events & string>(
        event: E,
        handler: Handler<Events[E]>,
    ): () => void

    /**
     * Emit an event with optional data.
     */
    emit<E extends keyof Events & string>(
        event: E,
        ...args: Events[E]
    ): void

    /**
     * Remove all listeners, optionally for a specific event.
     */
    clear<E extends keyof Events & string>(event?: E): void

    /**
     * Check if an event has any listeners.
     */
    has<E extends keyof Events & string>(event: E): boolean
}
