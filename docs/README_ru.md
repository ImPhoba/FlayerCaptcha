# FlayerCaptcha

| <sub>EN</sub> [English](README.md) | <sub>RU</sub> [Русский](README_ru.md) |
|---------------------------------------|--------------------------------------|

**FlayerCaptcha** — модуль для [Mineflayer](https://github.com/PrismarineJS/mineflayer)-ботов, упрощающий работу с изображениями карт в рамках и в инвентаре.

## Установка

```sh
npm i flayercaptcha
```

### Инициализация FlayerCaptcha

```js
const mineflayer = require('mineflayer');
const FlayerCaptcha = require('flayercaptcha');

const bot = mineflayer.createBot({ 
  host: 'localhost', 
  port: 25565, 
  username: 'username'
});

const captcha = new FlayerCaptcha(bot, {
  delay: 10,
  isStopped: false
});
```

**Параметры конфигурации:**

- `delay` — задержка в миллисекундах перед финальной сборкой изображения (по умолчанию 10).
- `isStopped` — если true, модуль не обрабатывает новые данные до вызова `captcha.resume()` (по умолчанию false).

```js
captcha.stop();   // приостанавливает обработку
captcha.resume(); // возобновляет обработку
```

## Событие `imageReady`

Срабатывает, когда готово итоговое изображение из нескольких рамок.

### Пример использования

```js
captcha.on('imageReady', async ({ data, image }) => {
  console.log('Данные об изображении получены:');
  console.table({
    ViewDir: data.viewDirection,
    MinDistance: data.minDistance,
    Facing: data.facing
  });

  // Данные о рамках
  for (const frame of data.frames) {
    console.table({
      EntityFrameId: frame.entityFrameId,
      MapId: frame.mapId,
      Rotate: frame.rotate,
      Coordinate: `x:${frame.coordinate.x}, y:${frame.coordinate.y}, z:${frame.coordinate.z}`,
      Distance: frame.distance
    });
    // Дополнительные данные: frame.nbtData
  }

  const filename = `image_${data.minDistance}.png`;
  await image.toFile(filename);
  console.log(`Изображение сохранено как ${filename}`);
});
```

**Аргументы:**

- `data` — объект с данными о собранном изображении:
  - `viewDirection` — направление взгляда
  - `minDistance` — минимальная дистанция до рамок
  - `facing` — направление, в котором находится рамка относительно взгляда бота. Возможные значения: `"forward"`, `"left"`, `"right"`, `"back"`, `"up"`, `"down"`.
  - `frames` — массив объектов с данными о каждой рамке (см. описание ниже)
- `image` — объект для работы с изображением ([Sharp](https://github.com/lovell/sharp))

## Событие `frameInfo`

Срабатывает при обнаружении рамки с изображением.

### Пример использования

```js
captcha.on('frameInfo', async ({ data, image }) => {
  console.log('Данные о рамке получены:');
  console.table({
    EntityFrameId: data.entityFrameId,
    MapId:         data.mapId,
    Rotate:        data.rotate,
    Coordinate:    `x:${data.coordinate.x}, y:${data.coordinate.y}, z:${data.coordinate.z}`,
    ViewDir:       data.viewDirection,
    Distance:      data.distance,
    Facing:        data.facing,
  });
  // Дополнительные данные: data.nbtData

  const filename = `frame_${data.entityFrameId}.png`;
  await image.toFile(filename);
  console.log(`Изображение сохранено как ${filename}`);
});
```

**Аргументы:**

- `data` — объект с данными о рамке:
  - `entityFrameId` — ID рамки (энтити)
  - `mapId` — ID карты
  - `rotate` — значение поворота предмета внутри рамки
  - `coordinate` — координаты рамки `{ x, y, z }`
  - `viewDirection` — направление взгляда рамки
  - `nbtData` — метаданные предмета внутри рамки
  - `distance` — расстояние от бота до рамки
  - `facing` — направление, в котором находится рамка относительно взгляда бота. Возможные значения: `"forward"`, `"left"`, `"right"`, `"back"`, `"up"`, `"down"`.

- `image` — объект для работы с изображением ([Sharp](https://github.com/lovell/sharp))

## Событие `inventoryInfo`

Срабатывает при обнаружении карты в инвентаре бота.

### Пример использования

```js
captcha.on('inventoryInfo', async ({ data, image }) => {
  console.log(`Данные о карте ${data.mapId} в инвентаре получены:`);
  for (const slot of data.slots) {
    console.log('SlotId:', slot.slotId);
    console.log('Item:', slot.item);
  }

  const filename = `inventory_${data.mapId}.png`;
  await image.toFile(filename);
  console.log(`Изображение сохранено как ${filename}`);
});
```

**Аргументы:**

- `data` — объект с данными о карте в инвентаре:
  - `slots` — слоты инвентаря, в которых найдены карты. Каждый слот содержит:
    - `slotId` — ID слота инвентаря
    - `item` — предмет карты с её данными
  - `mapId` — ID карты

- `image` — объект для работы с изображением ([Sharp](https://github.com/lovell/sharp))