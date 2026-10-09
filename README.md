# @shelamkoff/event-bus

Small, synchronous, dependency-free event bus for browser and Node.js libraries. It dispatches events inside one JavaScript runtime; it does not communicate across processes, workers, or browser tabs.

[Русская версия](./README.ru.md)

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

`emit()` invokes listeners **synchronously** in registration order and returns `void`. A dispatch takes a stable snapshot: changing subscriptions during the dispatch does not alter that snapshot. In particular, removing a listener does not cancel its invocation if it was already included. Subsequent emissions, including nested ones, use the updated subscription set.

Each `once()` registration is independent. It is marked as consumed **before** its callback runs; recursive and nested emissions cannot invoke the same one-time registration twice.

Errors are isolated per handler:

- A synchronous exception is caught and reported to `console.error`; the remaining handlers still run.
- A returned promise or thenable is **not awaited**. Rejections are observed and reported asynchronously to `console.error`, instead of becoming unhandled rejections.
- If error reporting or `debug: true` logging itself throws, that logging failure is suppressed so it cannot interrupt dispatch.

Reporting is best-effort: there is no error result or configurable error sink. Use an application-level asynchronous coordinator if failures must be observed by the publisher or handler results must be collected.

## Cleanup

Keep and call the function returned by `on()` or `once()` when a consumer has a shorter lifetime than the bus. A disposer affects only the registration it was created for, even after `off()`, `clear()`, or a subsequent re-subscription. Call `clear()` only when the owner intentionally releases all subscribers.

## Development and verification

From a standalone checkout of the repository:

```bash
npm ci
npm run check
npm pack --dry-run
```

`npm run check` runs the Node.js tests, strict TypeScript checks, and package build. GitHub Actions runs the same checks on Node.js 20, 22, and 24. The source version is defined in `package.json`; changing repository code does not publish a new npm release.

## Repository demo

To start the standalone example:

```bash
npm run demo
```

Open `http://127.0.0.1:4173/` (served from `index.html`). Set `PORT` to change the port. The demo requires no parent workspace and is excluded from the published npm package.

## Package exports

- `@shelamkoff/event-bus` — `EventBus` and the `EventMap` TypeScript type;
- `@shelamkoff/event-bus/package.json` — package metadata.

Released under the MIT License.
