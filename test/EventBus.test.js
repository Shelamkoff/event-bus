import test from 'node:test'
import assert from 'node:assert/strict'
import { EventBus } from '../index.js'

test('listeners run in registration order and unsubscribe independently', () => {
  const bus = new EventBus()
  const calls = []
  const offFirst = bus.on('event', value => calls.push(`first:${value}`))
  bus.on('event', value => calls.push(`second:${value}`))

  bus.emit('event', 1)
  offFirst()
  bus.emit('event', 2)

  assert.deepEqual(calls, ['first:1', 'second:1', 'second:2'])
})

test('once removes itself before invoking the handler', () => {
  const bus = new EventBus()
  let calls = 0
  bus.once('event', () => {
    calls += 1
    bus.emit('event')
  })
  bus.emit('event')
  assert.equal(calls, 1)
})

test('emit uses a stable listener snapshot', () => {
  const bus = new EventBus()
  const calls = []
  let offSecond
  bus.on('event', () => {
    calls.push('first')
    offSecond()
    bus.on('event', () => calls.push('late'))
  })
  offSecond = bus.on('event', () => calls.push('second'))

  bus.emit('event')
  assert.deepEqual(calls, ['first', 'second'])
})

test('one failing handler does not prevent the remaining handlers', () => {
  const bus = new EventBus()
  const original = console.error
  const errors = []
  console.error = (...args) => errors.push(args)
  let called = false
  try {
    bus.on('event', () => { throw new Error('failure') })
    bus.on('event', () => { called = true })
    bus.emit('event')
  } finally {
    console.error = original
  }
  assert.equal(called, true)
  assert.equal(errors.length, 1)
})

test('clear supports one event or the whole bus', () => {
  const bus = new EventBus()
  bus.on('a', () => {})
  bus.on('b', () => {})
  bus.clear('a')
  assert.equal(bus.has('a'), false)
  assert.equal(bus.has('b'), true)
  bus.clear()
  assert.equal(bus.has('b'), false)
})

test('invalid event names are rejected at the public boundary', () => {
  const bus = new EventBus()
  assert.throws(() => bus.on('', () => {}), TypeError)
  assert.throws(() => bus.emit(Symbol('event')), TypeError)
})

test('rejected async handlers are isolated without becoming unhandled rejections', async () => {
  const bus = new EventBus()
  const original = console.error
  const errors = []
  console.error = (...args) => errors.push(args)
  try {
    bus.on('event', async () => { throw new Error('async failure') })
    bus.emit('event')
    await Promise.resolve()
    await Promise.resolve()
  } finally {
    console.error = original
  }
  assert.equal(errors.length, 1)
  assert.match(errors[0][0], /async handler/)
})

test('rejected async once handlers are isolated too', async () => {
  const bus = new EventBus()
  const original = console.error
  const errors = []
  console.error = (...args) => errors.push(args)
  try {
    bus.once('event', async () => { throw new Error('once failure') })
    bus.emit('event')
    await Promise.resolve()
    await Promise.resolve()
  } finally {
    console.error = original
  }
  assert.equal(errors.length, 1)
  assert.equal(bus.has('event'), false)
})

test('all event-name boundaries and constructor options are validated', () => {
  const bus = new EventBus()
  assert.throws(() => new EventBus({ debug: 'yes' }), TypeError)
  assert.throws(() => bus.off('', () => {}), TypeError)
  assert.throws(() => bus.clear(''), TypeError)
  assert.throws(() => bus.has(''), TypeError)
})
