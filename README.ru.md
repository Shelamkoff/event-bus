# @shelamkoff/event-bus

Синхронная шина событий без зависимостей для браузерных и Node.js-библиотек. Обработчики вызываются в порядке регистрации. Ошибка или отклонённый Promise одного обработчика передаётся в `console.error` и не останавливает остальные.

[English README](./README.md)

## Установка

```bash
npm install @shelamkoff/event-bus
```

## Использование

```ts
import { EventBus } from '@shelamkoff/event-bus'

interface Events {
  ready: [id: string]
  close: []
}

const events = new EventBus<Events>()
const unsubscribe = events.on('ready', id => console.log(id))
events.once('close', () => console.log('closed'))

events.emit('ready', 'document-1')
unsubscribe()
events.clear()
```

`emit()` использует стабильный снимок обработчиков: добавление или удаление listener во время dispatch влияет на следующее событие. `once()` удаляет listener до вызова, поэтому рекурсивный `emit()` не вызывает его повторно.

## API

- `on(event, handler)` и `once(event, handler)` возвращают идемпотентную функцию отписки;
- `off(event, handler)` удаляет один обработчик;
- `emit(event, ...args)` выполняет синхронный dispatch;
- `clear(event?)` очищает одно событие или всю шину;
- `has(event)` проверяет наличие обработчиков;
- `new EventBus({ debug: true })` включает журнал событий.

Пакет `1.0.0` распространяется как ESM под лицензией MIT. Для Node.js требуется версия 20 или новее.
