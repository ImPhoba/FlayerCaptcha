const sharp = require('sharp');
const EventEmitter = require('events');
const ImageUtils = require('../utils/imageUtils');
const CoordinatesUtils = require('../utils/coordinatesUtils');

class ImageHandler extends EventEmitter {
    constructor() {
        super();
    }

    createImage(imageBuffer, rotate = 0) {
        return sharp(imageBuffer, {
            raw: {
                width: ImageUtils.mapSize,
                height: ImageUtils.mapSize,
                channels: 4
            }
        }).rotate(90 * rotate);
    }

    async processFrames(entityFramesData, viewDirection, deletedCoordinate) {
        const iniziators = this.getIniziators(viewDirection);
        const frames = Array.from(entityFramesData.values());
        const validFrames = frames.filter(frame => viewDirection === frame.viewDirection);

        const hasInvalidFrame = validFrames.some((frame) => {
            const frameInfo = this.getFrameInfo(frame.entityFrameId);
            return !frameInfo.mapImageBuffer;
        });
        if (hasInvalidFrame) return;

        const dataMaps = new Map();
        for (const [entityFrameId, data] of entityFramesData) {
            if (viewDirection === data.viewDirection) {
                const frameInfo = this.getFrameInfo(data.entityFrameId);
                if (!frameInfo.mapImageBuffer) return;
                dataMaps.set(data.coordinate, entityFrameId);
            };
        }

        const sortedCoordinates = CoordinatesUtils.sortCoordinates(dataMaps, viewDirection);

        for (const coordinates of sortedCoordinates) {
            const sendData = {
                coordinates: new Map(),
                x: [], y: [], z: []
            };

            for (const coordinate of coordinates) {
                const entityFrameId = dataMaps.get(coordinate);
                const { x, y, z } = coordinate;
                sendData.x.push(x);
                sendData.y.push(y);
                sendData.z.push(z);

                const frameInfo = this.getFrameInfo(entityFrameId);
                sendData.coordinates.set(coordinate, frameInfo);
            };

            const sendDataCoordinaes = Array.from(sendData.coordinates.keys()).filter(coordinate => {
                if (iniziators.has(JSON.stringify(coordinate)) ||
                    deletedCoordinate && CoordinatesUtils.isNeighbor(coordinate, deletedCoordinate, viewDirection)
                ) {
                    return true;
                };
            });

            if (!sendDataCoordinaes.length) continue

            const image = await this.#createFullImage(sendData, viewDirection);
            this.emit('imageReady', {
                image,
                viewDirection,
                coordinates: sendData.coordinates
            });
        };

        iniziators.clear();
    }

    async #createFullImage(data, viewDirection) {
        const { widthMapping, heightMapping } = ImageUtils.getImageMapping(data, viewDirection);
        const { widthKey, heightKey } = ImageUtils.getImageKeys(data, viewDirection);
        const { width, height } = ImageUtils.getImageSize(data, viewDirection);

        const imageBuffers = [];

        for (const [frameCoords, { frameData, mapImageBuffer }] of data.coordinates) {
            if (!frameData || !mapImageBuffer) continue;
            const frameValueRotation = viewDirection == 'up' ?
                frameData.rotate - 2 :
                frameData.rotate;

            const imageBufferPromise = this.createImage(mapImageBuffer, frameValueRotation).png().toBuffer();
            imageBuffers.push({ frameCoords, imageBufferPromise });
        }

        const composites = await Promise.all(imageBuffers.map(async ({ frameCoords, imageBufferPromise }) => {
            const imageBuffer = await imageBufferPromise;
            return {
                left: widthMapping.get(frameCoords[widthKey]),
                top: heightMapping.get(frameCoords[heightKey]),
                input: imageBuffer
            };
        }));

        const canvas = await sharp({
            create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
        }).png().toBuffer();

        return sharp(canvas).composite(composites);
    }
};

module.exports = ImageHandler;