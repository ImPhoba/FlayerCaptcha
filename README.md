# FlayerCaptcha

**FlayerCaptcha** is a module for automating captcha handling in Mineflayer bots for Minecraft versions 1.13.2 - 1.20.4. It allows for downloading and saving captcha images, simplifying bot interaction with servers.

## Example Usage

```javascript
const mineflayer = require('mineflayer');
const FlayerCaptcha = require('FlayerCaptcha');

(async () => {
    const bot = mineflayer.createBot({ host: 'localhost', port: 25565, username: "username" });

    const captcha = new FlayerCaptcha(bot);
    captcha.on('success', async (image) => {
        await image.toFile('captcha.png');
        console.log('Captcha saved');
    });
})();
