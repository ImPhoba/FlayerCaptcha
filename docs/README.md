# FlayerCaptcha

| <sub>EN</sub> [English](README.md) | <sub>RU</sub> [Русский](README_ru.md) |
|---------------------------------------|--------------------------------------|

**FlayerCaptcha** is a module for [Mineflayer](https://github.com/PrismarineJS/mineflayer) bots that simplifies working with map images in frames and inventory.

## Installation

```sh
npm i flayercaptcha
```

### FlayerCaptcha Initialization

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

**Configuration parameters:**

- `delay` — delay in milliseconds before the final image assembly (default is 10).
- `isStopped` — if true, the module does not process new data until `captcha.resume()` is called (default is false).

```js
captcha.stop();   // pauses processing
captcha.resume(); // resumes processing
```

## `imageReady` Event

Triggered when the final image from multiple frames is ready.

### Usage Example

```js
captcha.on('imageReady', async ({ data, image }) => {
  console.log('Image data received:');
  console.table({
    ViewDir: data.viewDirection,
    MinDistance: data.minDistance,
    Facing: data.facing
  });

  // Frame data
  for (const frame of data.frames) {
    console.table({
      EntityFrameId: frame.entityFrameId,
      MapId: frame.mapId,
      Rotate: frame.rotate,
      Coordinate: `x:${frame.coordinate.x}, y:${frame.coordinate.y}, z:${frame.coordinate.z}`,
      Distance: frame.distance
    });
    // Additional data: frame.nbtData
  }

  const filename = `image_${data.minDistance}.png`;
  await image.toFile(filename);
  console.log(`Image saved as ${filename}`);
});
```

**Arguments:**

- `data` — object with information about the assembled image:
  - `viewDirection` — view direction
  - `minDistance` — minimum distance to frames
  - `facing` — direction of the frame relative to the bot's view. Possible values: `"forward"`, `"left"`, `"right"`, `"back"`, `"up"`, `"down"`.
  - `frames` — array of objects with data about each frame (see below)
- `image` — image object ([Sharp](https://github.com/lovell/sharp))

## `frameInfo` Event

Triggered when a frame with an image is detected.

### Usage Example

```js
captcha.on('frameInfo', async ({ data, image }) => {
  console.log('Frame data received:');
  console.table({
    EntityFrameId: data.entityFrameId,
    MapId:         data.mapId,
    Rotate:        data.rotate,
    Coordinate:    `x:${data.coordinate.x}, y:${data.coordinate.y}, z:${data.coordinate.z}`,
    ViewDir:       data.viewDirection,
    Distance:      data.distance,
    Facing:        data.facing,
  });
  // Additional data: data.nbtData

  const filename = `frame_${data.entityFrameId}.png`;
  await image.toFile(filename);
  console.log(`Image saved as ${filename}`);
});
```

**Arguments:**

- `data` — object with frame data:
  - `entityFrameId` — frame entity ID
  - `mapId` — map ID
  - `rotate` — rotation value of the item inside the frame
  - `coordinate` — frame coordinates `{ x, y, z }`
  - `viewDirection` — frame view direction
  - `nbtData` — metadata of the item inside the frame
  - `distance` — distance from the bot to the frame
  - `facing` — direction of the frame relative to the bot's view. Possible values: `"forward"`, `"left"`, `"right"`, `"back"`, `"up"`, `"down"`.

- `image` — image object ([Sharp](https://github.com/lovell/sharp))

## `inventoryInfo` Event

Triggered when a map is detected in the bot's inventory.

### Usage Example

```js
captcha.on('inventoryInfo', async ({ data, image }) => {
  console.log(`Data for map ${data.mapId} in inventory received:`);
  for (const slot of data.slots) {
    console.log('SlotId:', slot.slotId);
    console.log('Item:', slot.item);
  }

  const filename = `inventory_${data.mapId}.png`;
  await image.toFile(filename);
  console.log(`Image saved as ${filename}`);
});
```

**Arguments:**

- `data` — object with data about the map in inventory:
  - `slots` — inventory slots where maps were found. Each slot contains:
    - `slotId` — inventory slot ID
    - `item` — map item with its data
  - `mapId` — map ID

- `image` — image object ([Sharp](https://github.com/lovell/sharp))