const EventEmitter = require('events');
const sharp = require('sharp');
const colorMap = require('./utils/captcha/colors.json');

class FlayerCaptcha extends EventEmitter {
    constructor(bot, options = { isStopped: false }) {
        super();
        this.bot = bot;
        this.isStopped = options.isStopped || false;

        this.initializations();

        this.yaws = { "2": '1', "3": '2', "5": '3', "0": '4' };
    };

    stop() { this.updateState(true) }
    resume() { this.updateState(false) }

    updateState(isStopped) {
        if (this.isStopped != isStopped) {
            this.isStopped = isStopped;
            this.setDefaultSettings();
        }
    }

    setDefaultSettings() {
        this.img = {
            maps: new Map(), images: [],
            x: [], y: [], z: [],
            yaw: null,
        };
        this.keys = this.getCorrectKeys();
    }

    isNotSupportedVersion() {
        if (this.bot.registry.version['<=']('1.13.1') || this.bot.registry.version['>=']('1.20.5')) {
            console.error(`Unsupported bot version: ${this.bot.version}`);
            this.stop();
        }
    }

    getCorrectKeys() {
        if (this.bot.registry.version['<=']('1.13.2')) {
            return { keyRotate: 7, keyItem: 6 }
        } else if (this.bot.registry.version['<=']('1.16.5')) {
            return { keyRotate: 8, keyItem: 7 }
        }

        return { keyRotate: 9, keyItem: 8 };
    }

    isFilledMap(itemId) { return this.bot.registry.items[itemId]?.name == 'filled_map'; }
    isFrame(entityType) {
        const frames = new Set(['item_frame', 'item_frames', 'glow_item_frame']);
        const entityName = this.bot.registry.entities[entityType]?.name;
        return frames.has(entityName);
    }

    initializations() {
        this.bot._client.on('login', () => {
            this.isNotSupportedVersion();
            if (this.isStopped) return;
            this.setDefaultSettings();
        })

        this.bot._client.on('packet', async (packet) => {
            if (!packet || this.isStopped) return;

            const { itemDamage, data, item } = packet;
            if (data && typeof itemDamage == 'number') {
                this.img.maps.set(itemDamage, data);
            } else if (this.isFilledMap(item?.itemId)) {

                const idMap = item.nbtData ? item.nbtData.value.map.value : 0;
                const imgBuf = await this.takeImgBuf(idMap);

                this.img.images.push([{ x: 0, y: 0, z: 0 }, imgBuf, 0]);
                this.createCaptchaImage();
            }
        })

        this.bot._client.on('entity_metadata', async ({ entityId, metadata }) => {
            if (this.isStopped) return;

            const { entityType, position, yaw } = this.bot.entities[entityId];
            if (!this.isFrame(entityType)) return;

            const itemData = metadata.find(v => v.key === this.keys.keyItem)?.value;

            if (!this.isFilledMap(itemData?.itemId)) return;

            this.img.y.push(position.y);
            this.img.x.push(position.x);
            this.img.z.push(position.z);

            this.img.yaw = this.yaws[yaw.toFixed(0)];

            const idMap = itemData.nbtData.value.map.value;
            const imgBuf = await this.takeImgBuf(idMap);

            const rotate = metadata.find(v => v.key === this.keys.keyRotate)?.value || 0;

            this.img.images.push([position, imgBuf, rotate]);
            this.createCaptchaImage();
        })
    }

    async takeImgBuf(idMap) {
        let imgBuf;

        while (!imgBuf && !this.isStopped) {
            imgBuf = this.img.maps.get(idMap);
            if (!imgBuf) {
                await this.sleep(100)
            };
        };

        return imgBuf ? this.getImgBuf(imgBuf) : null;
    }

    async createCaptchaImage() {
        if (this.isStopped || this.img.images.length !== this.img.maps.size || this.img.y.length > this.img.images.length) {
            return
        }

        let readImages = [];

        for (const [_, imgBuf, rotate] of this.img.images) {
            const imageBuffer = sharp(imgBuf, { raw: { width: 128, height: 128, channels: 4 } })
                .rotate(90 * rotate).png().toBuffer();
            readImages.push(imageBuffer);
        }

        readImages = await Promise.all(readImages);

        const key = new Set(this.img.x).size === 1 ? 'z' : 'x';
        if (this.img.x.length && this.img.y.length) {
            var { mapping: wMapping, value: width } = this.createCoordinateMappingAndValue(this.img[key]);
            var { mapping: hMapping, value: height } = this.createCoordinateMappingAndValue(this.img.y, true);
        } else {
            var [hMapping, wMapping, width, height] = [new Map([[0, 0]]), new Map([[0, 0]]), 128, 128];
        }

        const composites = readImages.map((imageBuffer, i) => {
            const [position] = this.img.images[i];
            return {
                input: imageBuffer,
                left: wMapping.get(position.x),
                top: hMapping.get(position.y)
            };
        });

        const baseImage = await sharp({ create: { width, height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
            .png().toBuffer();

        const image = sharp(baseImage).composite(composites);

        this.setDefaultSettings();
        this.emit('success', image);
    }

    createCoordinateMappingAndValue(values, type = false) {
        const sortOrder = !type && (this.img.yaw == 1 || this.img.yaw == 2) ? (a, b) => a - b : (a, b) => b - a;

        const uniqueValues = [...new Set(values)];
        const sortValues = uniqueValues.sort(sortOrder);

        const maxValue = sortValues[0];
        const minValue = uniqueValues[sortValues.length - 1];

        const value = Math.abs(maxValue - minValue) + 1;
        const mapping = new Map(sortValues.map((val, index) => [val, index * 128]));

        return { mapping, value: value * 128 };
    }

    getImgBuf(buf) {
        const imgBuf = new Uint8ClampedArray(65536);
        const cache = new Map();

        buf.forEach((color, i) => {
            const colorArr = cache.get(color) || colorMap[color];
            cache.set(color, colorArr);
            imgBuf.set(colorArr, i * 4);
        });

        return imgBuf;
    }

    sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
};

module.exports = FlayerCaptcha;