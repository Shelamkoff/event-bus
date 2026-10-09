# @shelamkoff/event-bus

Small, synchronous, dependency-free event bus for browser and Node.js libraries.

[Русская версия](./README.ru.md)

Current version: `1.0.0`.

## Requirements and installation

- ESM environment;
- Node.js 20 or newer when used in Node.js;
- no runtime dependencies.

```bash
npm install @shelamkoff/event-bus
```

## Quick start

```ts
import { EventBus } from '@shelamkoff/event-bus'

interface EditorEvents {
  ready: [documentId: string]
  change: [version: number]
  close: []
}

const events = new EventBus<EditorEvents>()
const unsubscribe = events.on('change', version => {
  console.log('Document version:', version)
})

events.once('ready', documentId => console.log('Ready:', documentId))
events.emit('ready', 'document-1')
events.emit('change', 2)

unsubscribe()
events.clear()
```

The generic event map is optional, but recommended for TypeScript consumers. Each event maps to the tuple of arguments accepted by `emit()` and received by its handlers. For a union of event names with incompatible payloads, narrow the event name before calling `emit()`.

## API

| API | Result |
| --- | --- |
| `new EventBus({ debug?: boolean })` | Creates an isolated bus. `debug: true` logs emissions to `console.log`. |
| `on(event, handler)` | Registers a handler and returns an idempotent unsubscribe function. Repeated registration of the same function shares one active subscription; either disposer can remove it. A stale disposer cannot remove a later registration. |
| `once(event, handler)` | Registers an independent single-use handler and returns an idempotent unsubscribe function. Each call is independent, even with the same callback. |
| `off(event, handler)` | Removes all registrations of that original handler, including `once()` registrations. Missing handlers are ignored. |
| `emit(event, ...args)` | Calls the current handlers synchronously, in registration order. Returns `void`. |
| `has(event)` | Returns whether the event currently has at least one handler. |
| `clear(event)` | Removes every handler for one event. |
| `clear()` | Removes every handler from the bus. |

Event names must be non-empty strings. Invalid event names and non-function handlers are rejected with `TypeError`.

## Dispatch semantics

`emit()` takes a stable snapshot of the current handler set. Adding or removing handlers during an emission affects the next emission, not the one already in progress. `once()` marks its registration as consumed before invoking the callback. Recursive or nested emissions cannot invoke the same one-time registration twice, even when earlier snapshots still contain it.

Handler failures are isolated:

- a thrown error is reported to `console.error`, then dispatch continues;
- a returned promise is not awaited because dispatch is synchronous;
- a rejected returned promise is observed and reported to `console.error` to avoid an unhandled rejection.
- failures inside `console.error` or the optional debug `console.log` are suppressed to preserve dispatch isolation.

Use an async coordinator in application code when handlers must be awaited or when their results must be collected.

## Cleanup

Keep and call the function returned by `on()` or `once()` when a consumer has a shorter lifetime than the bus. A disposer affects only the registration it was created for, even after `off()`, `clear()`, or a subsequent re-subscription. Call `clear()` only when the owner intentionally releases all subscribers.

## Repository demo

From a standalone checkout of this repository:

```bash
npm run demo
```

Open `http://127.0.0.1:4173/`. Set `PORT` to change the port. The demo runs without a parent workspace and is not included in the npm package.

## Package exports

- `@shelamkoff/event-bus` — `EventBus` and the `EventMap` TypeScript type;
- `@shelamkoff/event-bus/package.json` — package metadata.

Released under the MIT License.
