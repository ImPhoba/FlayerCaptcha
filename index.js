const EventEmitter = require('events');
const sharp = require('sharp');

const initializations = require('./utils/initializations');
const sortCoordinatesByProximity = require('./utils/sortCoordinatesByProximity');
const { getImageKeys, getImageSize, getImageMapping } = require('./utils/imageUtils');
const { getMetadataKeys, getImageBuffer } = require('./utils/itemUtils');

class FlayerCaptcha extends EventEmitter {
    constructor(bot, options = { isStopped: false }) {
        super();

        this.bot = bot;
        this.isStopped = options.isStopped || false;
        initializations.bind(this)();
    };

    stop() { this.updateState(true); }
    resume() { this.updateState(false); }

    updateState(isStopped) {
        if (this.isStopped != isStopped) {
            this.isStopped = isStopped;
            this.resetState();
        }
    }

    resetState() {
        this.metadataKeys = getMetadataKeys(this.bot);
        this.timeoutId = null;
        this.isSendedData = new Map();
        this.idBuf = new Map();
        this.idGeo = new Set();
        this.viewDirectionGeo = new Map();
        this.posYawData = new Map();
        this.entities = new Map();
    }

    sendCompleteDataMap(updateData = false) {
        if (this.timeoutId) clearTimeout(this.timeoutId);

        this.timeoutId = setTimeout(() => {
            const isUpdateData = updateData !== false;

            const sendDatas = new Map();

            for (const [viewDirection, positions] of this.viewDirectionGeo) {
                if (!positions.length || isUpdateData && updateData != viewDirection) continue;

                if (!sendDatas.has(viewDirection)) sendDatas.set(viewDirection, []);
                const datas = sortCoordinatesByProximity(positions);

                for (const index in datas) {
                    sendDatas.get(viewDirection)[index] = {
                        positions: new Map(),
                        x: [], y: [], z: []
                    };
                    const sendData = sendDatas.get(viewDirection)[index];
                    for (let position of datas[index]) {
                        const id = this.posYawData.get(position)?.get(viewDirection)?.id;
                        if (!this.idBuf.has(id)) return;

                        sendData.positions.set(position, id);

                        const { x, y, z } = position;
                        sendData.x.push(x);
                        sendData.y.push(y);
                        sendData.z.push(z);
                    };
                }
            }

            for (const [viewDirection, datas] of sendDatas) {
                for (const data of datas) {
                    const isNewData = !this.isSendedData.has(viewDirection);
                    const isUnicData = this.isSendedData.get(viewDirection) !== JSON.stringify(data);

                    if (isNewData || isUpdateData || isUnicData) {
                        this.isSendedData.set(viewDirection, JSON.stringify(data));
                        this.createCaptchaImage(data, viewDirection);
                    }
                }
            }
        }, 10)
    }

    processingKeyDelete({ entityId = null, value, viewDirection }) {
        if (entityId != null) {
            if (!this.entities.has(entityId)) return;
            var { value, viewDirection } = this.entities.get(entityId);
        }

        const oldId = this.posYawData.get(value)?.get(viewDirection)?.id;
        if (oldId === undefined) return;

        this.posYawData.get(value).delete(viewDirection);
        this.isSendedData.delete(viewDirection);

        const newData = this.viewDirectionGeo.get(viewDirection).filter(position => position !== value);

        this.viewDirectionGeo.set(viewDirection, newData);
        this.sendCompleteDataMap(viewDirection);
    }

    async updateDataMaps({ id, value, key, rotate, viewDirection, entityId }) {
        if (key == 'rotate') {
            if (!this.posYawData.has(value)) {
                this.posYawData.set(value, new Map());
            }

            this.posYawData.get(value).set(viewDirection, { id, rotate });
            return this.sendCompleteDataMap(viewDirection);
        } else if (key == 'buf') {
            const buffer = getImageBuffer(value);
            if (this.idBuf.has(id)) {
                if (this.idBuf.get(id).toString() === buffer.toString()) return true;
            };

            this.idBuf.set(id, buffer);
        } else if (key == 'pos') {
            const response = this.processingKeyPos(id, value, viewDirection, entityId);
            if (!this.posYawData.has(value)) {
                this.posYawData.set(value, new Map());
            }

            this.posYawData.get(value).set(viewDirection, { id, rotate });
            if (response) return;
        };

        if (this.idGeo.size > this.idBuf.size || !this.idGeo.has(id) || !this.idBuf.has(id)) return;
        this.sendCompleteDataMap();
    }

    processingKeyPos(id, value, viewDirection, entityId) {
        this.entities.set(entityId, { viewDirection, value });

        const oldId = this.posYawData.get(value)?.get(viewDirection)?.id;
        if (oldId == id) return true;

        this.idGeo.add(id);

        if (!this.viewDirectionGeo.has(viewDirection)) {
            this.viewDirectionGeo.set(viewDirection, []);
        }
        this.viewDirectionGeo.get(viewDirection).push(value);
    }

    async createCaptchaImage(data, viewDirection) {
        const { widthMapping, heightMapping } = getImageMapping(data, viewDirection);
        const { widthKey, heightKey } = getImageKeys(data, viewDirection);
        const { width, height } = getImageSize(data, viewDirection);

        let images = [];

        for (const [position, id] of data.positions) {
            let rotate = this.posYawData.get(position).get(viewDirection).rotate;
            if (['up'].includes(viewDirection)) rotate -= 2;

            const image = this.idBuf.get(id);
            const buffer = sharp(image, { raw: { width: 128, height: 128, channels: 4 } })
                .rotate(90 * rotate).png().toBuffer();

            images.push({ position, buffer });
        }

        const composites = await Promise.all(images.map(async (image) => {
            const buffer = await image.buffer;
            const position = image.position;
            return {
                left: widthMapping.get(position[widthKey]),
                top: heightMapping.get(position[heightKey]),
                input: buffer
            };
        }));

        const canvas = await sharp({
            create: { width, height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
        }).png().toBuffer();

        const image = sharp(canvas).composite(composites);
        this.emit('success', image, viewDirection);
    }
};

module.exports = FlayerCaptcha;