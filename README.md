# FlayerCaptcha

**FlayerCaptcha** is a module for **Mineflayer** bots that makes it easier to work with images on Minecraft servers.

## Installation

```sh
npm i flayercaptcha
```

## Example Usage

```javascript
const mineflayer = require('mineflayer');
const FlayerCaptcha = require('FlayerCaptcha');

(async () => {
    const bot = mineflayer.createBot({ host: 'localhost', port: 25565, username: 'username' });

    const captcha = new FlayerCaptcha(bot);
    captcha.on('success', async (image, viewDirection) => {
        await image.toFile('captcha.png');
        console.log('Captcha saved');
    });
})();
