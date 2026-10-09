import { EventBus, type EventMap } from '../index.js'

interface Events {
  ready: [documentId: string]
  increment: [value: number, label?: string]
  close: []
  single: [value: string]
}

const bus = new EventBus<Events>()
bus.on('ready', id => { id.toUpperCase() })
bus.once('increment', (value, label) => {
  const x: number = value
  const y: string | undefined = label
  void x
  void y
})
bus.emit('ready', 'document')
bus.emit('increment', 10)
bus.emit('increment', 10, 'label')
bus.emit('close')
bus.emit('single', 'text')

// @ts-expect-error wrong event payload
bus.emit('ready', 123)
// @ts-expect-error unknown event
bus.on('unknown', () => {})
// @ts-expect-error missing event payload
bus.emit('ready')
// @ts-expect-error too many arguments
bus.emit('close', 1)
// @ts-expect-error extra required payload
bus.emit('increment', 10, 'label', 123)

const dynamicEvent: 'ready' | 'increment' = Math.random() > 0.5 ? 'ready' : 'increment'
// @ts-expect-error an event-name union cannot lose payload correlation
bus.emit(dynamicEvent, 'document')
// @ts-expect-error an event-name union cannot lose payload correlation
bus.emit(dynamicEvent, 10)

if (dynamicEvent === 'ready') bus.emit(dynamicEvent, 'document')
else bus.emit(dynamicEvent, 10)

// A union key is valid when every branch accepts the same payload.
const samePayloadEvent: 'ready' | 'single' = Math.random() > 0.5 ? 'ready' : 'single'
bus.emit(samePayloadEvent, 'document')

const loose = new EventBus()
loose.emit('anything', { payload: true })
loose.on('anything', () => {})
const record: EventMap = { arbitrary: ['value'] }
void record
