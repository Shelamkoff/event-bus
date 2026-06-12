import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { EventBus } from '../index.js'

describe('EventBus', () => {
    /** @type {EventBus} */
    let bus

    beforeEach(() => {
        bus = new EventBus()
    })

    describe('on()', () => {
        it('subscribes and receives events', () => {
            const calls = []
            bus.on('test', (v) => calls.push(v))

            bus.emit('test', 'a')
            bus.emit('test', 'b')

            assert.deepEqual(calls, ['a', 'b'])
        })

        it('supports multiple handlers for the same event', () => {
            const calls = []
            bus.on('test', () => calls.push(1))
            bus.on('test', () => calls.push(2))

            bus.emit('test')

            assert.deepEqual(calls, [1, 2])
        })

        it('supports multiple arguments', () => {
            const calls = []
            bus.on('test', (a, b, c) => calls.push([a, b, c]))

            bus.emit('test', 1, 'two', true)

            assert.deepEqual(calls, [[1, 'two', true]])
        })

        it('returns an unsubscribe function', () => {
            const calls = []
            const unsub = bus.on('test', () => calls.push(1))

            bus.emit('test')
            unsub()
            bus.emit('test')

            assert.deepEqual(calls, [1])
        })

        it('deduplicates the same handler reference', () => {
            const calls = []
            const handler = () => calls.push(1)

            bus.on('test', handler)
            bus.on('test', handler)

            bus.emit('test')

            assert.deepEqual(calls, [1])
        })

        it('throws TypeError for non-function handler', () => {
            assert.throws(
                () => bus.on('test', 'not a function'),
                { name: 'TypeError', message: /must be a function/ },
            )
        })
    })

    describe('off()', () => {
        it('removes a specific handler', () => {
            const calls = []
            const handler = () => calls.push(1)

            bus.on('test', handler)
            bus.off('test', handler)
            bus.emit('test')

            assert.deepEqual(calls, [])
        })

        it('does not throw for unknown event', () => {
            assert.doesNotThrow(() => bus.off('nope', () => {}))
        })

        it('does not throw for unknown handler', () => {
            bus.on('test', () => {})

            assert.doesNotThrow(() => bus.off('test', () => {}))
        })

        it('cleans up empty Set from internal map', () => {
            const handler = () => {}
            bus.on('test', handler)
            bus.off('test', handler)

            assert.equal(bus.has('test'), false)
        })
    })

    describe('once()', () => {
        it('fires handler exactly once', () => {
            const calls = []
            bus.once('test', (v) => calls.push(v))

            bus.emit('test', 'first')
            bus.emit('test', 'second')

            assert.deepEqual(calls, ['first'])
        })

        it('supports multiple arguments', () => {
            const calls = []
            bus.once('test', (a, b) => calls.push([a, b]))

            bus.emit('test', 1, 2)

            assert.deepEqual(calls, [[1, 2]])
        })

        it('returns a working unsubscribe function', () => {
            const calls = []
            const unsub = bus.once('test', () => calls.push(1))

            unsub()
            bus.emit('test')

            assert.deepEqual(calls, [])
        })

        it('cleans up after firing', () => {
            bus.once('test', () => {})
            bus.emit('test')

            assert.equal(bus.has('test'), false)
        })

        it('throws TypeError for non-function handler', () => {
            assert.throws(
                () => bus.once('test', null),
                { name: 'TypeError', message: /must be a function/ },
            )
        })

        it('still fires if handler throws', () => {
            const calls = []

            bus.once('test', () => { throw new Error('boom') })
            bus.on('test', () => calls.push('after'))

            bus.emit('test')
            bus.emit('test')

            // once handler removed despite error, regular handler still fires
            assert.deepEqual(calls, ['after', 'after'])
        })
    })

    describe('emit()', () => {
        it('does nothing for events with no listeners', () => {
            assert.doesNotThrow(() => bus.emit('nope', 'data'))
        })

        it('isolates handler errors', () => {
            const calls = []
            const fn = mock.fn()

            // Suppress console.error during this test
            const origError = console.error
            console.error = fn

            bus.on('test', () => { throw new Error('fail') })
            bus.on('test', () => calls.push('ok'))

            bus.emit('test')

            console.error = origError

            assert.deepEqual(calls, ['ok'])
            assert.equal(fn.mock.calls.length, 1)
        })

        it('snapshots handlers to avoid mutation during iteration', () => {
            const calls = []

            bus.on('test', () => {
                calls.push('a')
                // Adding a handler mid-emit should not fire it in this cycle
                bus.on('test', () => calls.push('b'))
            })

            bus.emit('test')

            assert.deepEqual(calls, ['a'])

            // But it fires on the next emit
            bus.emit('test')

            assert.ok(calls.includes('b'))
        })
    })

    describe('clear()', () => {
        it('removes all listeners for a specific event', () => {
            const calls = []
            bus.on('a', () => calls.push('a'))
            bus.on('b', () => calls.push('b'))

            bus.clear('a')
            bus.emit('a')
            bus.emit('b')

            assert.deepEqual(calls, ['b'])
        })

        it('removes all listeners when called without arguments', () => {
            bus.on('a', () => {})
            bus.on('b', () => {})

            bus.clear()

            assert.equal(bus.has('a'), false)
            assert.equal(bus.has('b'), false)
        })

        it('handles empty string event name correctly', () => {
            const calls = []
            bus.on('', () => calls.push('empty'))
            bus.on('other', () => calls.push('other'))

            bus.clear('')
            bus.emit('')
            bus.emit('other')

            assert.deepEqual(calls, ['other'])
        })
    })

    describe('has()', () => {
        it('returns true when listeners exist', () => {
            bus.on('test', () => {})

            assert.equal(bus.has('test'), true)
        })

        it('returns false when no listeners exist', () => {
            assert.equal(bus.has('test'), false)
        })

        it('returns false after all handlers removed', () => {
            const handler = () => {}
            bus.on('test', handler)
            bus.off('test', handler)

            assert.equal(bus.has('test'), false)
        })
    })

    describe('debug mode', () => {
        it('logs emit calls when debug is true', () => {
            const debugBus = new EventBus({ debug: true })
            const fn = mock.fn()

            const origLog = console.log
            console.log = fn

            debugBus.emit('test', 'data')

            console.log = origLog

            assert.equal(fn.mock.calls.length, 1)
            assert.ok(fn.mock.calls[0].arguments[0].includes('[EventBus] emit: test'))
        })

        it('does not log when debug is false', () => {
            const fn = mock.fn()

            const origLog = console.log
            console.log = fn

            bus.emit('test')

            console.log = origLog

            assert.equal(fn.mock.calls.length, 0)
        })
    })
})
