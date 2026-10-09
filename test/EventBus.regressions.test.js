import test from 'node:test'
import assert from 'node:assert/strict'
import { EventBus } from '../index.js'

test('once runs at most once when an earlier listener emits recursively', () => {
  const bus = new EventBus()
  const calls = []
  let nested = false
  bus.on('change', () => {
    calls.push('regular')
    if (!nested) {
      nested = true
      bus.emit('change')
    }
  })
  bus.once('change', () => calls.push('once'))
  bus.on('change', () => calls.push('last'))
  bus.emit('change')
  assert.deepEqual(calls, ['regular', 'regular', 'once', 'last', 'last'])
  assert.equal(bus.has('change'), true)
  bus.clear()
})

test('once stays consumed even when its callback throws or recursively emits', () => {
  const bus = new EventBus()
  const errors = []
  const original = console.error
  console.error = (...args) => errors.push(args)
  let calls = 0
  try {
    bus.once('change', () => {
      calls++
      bus.emit('change')
      throw new Error('failure')
    })
    bus.emit('change')
    bus.emit('change')
  } finally {
    console.error = original
  }
  assert.equal(calls, 1)
  assert.equal(errors.length, 1)
  assert.equal(bus.has('change'), false)
})

test('stale unsubscribe does not remove a newly registered handler', () => {
  const bus = new EventBus()
  const fn = () => {}
  const stale = bus.on('change', fn)
  stale()
  const fresh = bus.on('change', fn)
  stale()
  assert.equal(bus.has('change'), true)
  fresh()
  assert.equal(bus.has('change'), false)
})

test('unsubscribe from before off or clear does not remove a replacement', () => {
  for (const remove of [bus => bus.off('change', bus.handler), bus => bus.clear('change'), bus => bus.clear()]) {
    const bus = new EventBus()
    const handler = () => {}
    bus.handler = handler
    const oldUnsubscribe = bus.on('change', handler)
    remove(bus)
    bus.on('change', handler)
    oldUnsubscribe()
    assert.equal(bus.has('change'), true)
  }
})

test('duplicate on calls share the same registration generation', () => {
  const bus = new EventBus()
  const calls = []
  const fn = value => calls.push(value)
  const first = bus.on('change', fn)
  const second = bus.on('change', fn)
  bus.emit('change', 1)
  first()
  const third = bus.on('change', fn)
  second()
  bus.emit('change', 2)
  third()
  assert.deepEqual(calls, [1, 2])
  assert.equal(bus.has('change'), false)
})

test('off accepts the original function passed to once, including duplicates', () => {
  const bus = new EventBus()
  const handler = () => assert.fail('removed handler must not run')
  bus.once('change', handler)
  bus.once('change', handler)
  bus.on('change', handler)
  bus.off('change', handler)
  assert.equal(bus.has('change'), false)
  bus.emit('change')
})

test('two once registrations with the same function remain independent', () => {
  const bus = new EventBus()
  let calls = 0
  const fn = () => calls++
  bus.once('change', fn)
  bus.once('change', fn)
  bus.emit('change')
  bus.emit('change')
  assert.equal(calls, 2)
  assert.equal(bus.has('change'), false)
})

test('a stale once disposer cannot remove a new once registration', () => {
  const bus = new EventBus()
  const fn = () => {}
  const old = bus.once('change', fn)
  bus.clear()
  bus.once('change', fn)
  old()
  assert.equal(bus.has('change'), true)
})

test('removing a once listener during emission keeps the snapshot intact', () => {
  const bus = new EventBus()
  const calls = []
  const fn = () => calls.push('once')
  bus.on('change', () => {
    calls.push('first')
    bus.off('change', fn)
  })
  bus.once('change', fn)
  bus.emit('change')
  assert.deepEqual(calls, ['first', 'once'])
})

test('event handlers run with the same undefined receiver as before', () => {
  const bus = new EventBus()
  const receivers = []
  bus.on('change', function () { receivers.push(this) })
  bus.once('change', function () { receivers.push(this) })
  bus.emit('change')
  assert.deepEqual(receivers, [undefined, undefined])
})

test('throwing console.error does not interrupt remaining listeners', () => {
  const bus = new EventBus()
  const calls = []
  const original = console.error
  console.error = () => { throw new Error('logging failure') }
  try {
    bus.on('change', () => { throw new Error('handler failure') })
    bus.on('change', () => calls.push('success'))
    assert.doesNotThrow(() => bus.emit('change'))
    assert.deepEqual(calls, ['success'])
  } finally {
    console.error = original
  }
})

test('absent console.error and throwing then getter do not stop dispatch', () => {
  const bus = new EventBus()
  const calls = []
  const original = console.error
  console.error = undefined
  try {
    bus.on('change', () => ({ get then() { throw new Error('getter failure') } }))
    bus.on('change', () => calls.push('success'))
    assert.doesNotThrow(() => bus.emit('change'))
    assert.deepEqual(calls, ['success'])
  } finally {
    console.error = original
  }
})

test('failing error logger cannot create an unhandled async rejection', async () => {
  const bus = new EventBus()
  const calls = []
  const original = console.error
  console.error = () => { throw new Error('logging failure') }
  try {
    bus.on('change', async () => { throw new Error('rejection') })
    bus.on('change', () => calls.push('success'))
    bus.emit('change')
    await new Promise(resolve => setImmediate(resolve))
  } finally {
    console.error = original
  }
  assert.deepEqual(calls, ['success'])
})

test('throwing debug console.log cannot interrupt emission', () => {
  const bus = new EventBus({ debug: true })
  const original = console.log
  let calls = 0
  console.log = () => { throw new Error('debug logging failure') }
  try {
    bus.on('change', () => calls++)
    assert.doesNotThrow(() => bus.emit('change'))
  } finally {
    console.log = original
  }
  assert.equal(calls, 1)
})
