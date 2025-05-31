const EventEmitter = require('events');
const InventoryMapManager = require('./inventoryMapManager');
const FrameMapManager = require('./frameMapManager');
const EntityUtils = require('../utils/entityUtils');
const ItemUtils = require('../utils/itemUtils');

class MapManager extends EventEmitter {
    /**
      * Stores image buffers for maps.
      * @type {Map<number, Buffer>}
      * Key - The ID of the map.
      * Value - The image buffer associated with the map.
      */
    #mapImageBuffers = new Map();

    constructor(delay) {
        super();
        this.delay = delay;

        this.frameMapManager = new FrameMapManager(this);
        this.frameMapManager.on('imageReady', data => {
            const botPosition = this.bot.entity.position;
            const { image, coordinates, viewDirection } = data;

            const frames = Array.from(coordinates).map(([_, { frameData }]) => {
                if (frameData) {
                    const { viewDirection, ...rest } = frameData;
                    return {
                        ...rest,
                        distance: EntityUtils.distance(botPosition, frameData.coordinate)
                    };
                }
            }).filter(Boolean);
            if (!frames.length) return;

            this.emit('imageReady', {
                data: {
                    frames,
                    viewDirection,
                    minDistance: EntityUtils.getMinDistance(this.bot.entity.position, coordinates),
                    facing: EntityUtils.getFacing(this.bot.entity, viewDirection)
                },
                image
            });
        });
        this.frameMapManager.on('frameInfo', data => {
            const botPosition = this.bot.entity.position;
            const { image, frameData } = data;

            this.emit('frameInfo', {
                data: {
                    ...frameData,
                    distance: EntityUtils.distance(botPosition, frameData.coordinate),
                    facing: EntityUtils.getFacing(this.bot.entity, frameData.viewDirection)
                },
                image
            });
        });
        this.inventoryMapManager = new InventoryMapManager(this);
        this.inventoryMapManager.on('inventoryInfo', data => this.emit('inventoryInfo', data));
    }

    resetState() {
        this.#mapImageBuffers.clear();
        this.frameMapManager.resetState();
        this.inventoryMapManager.resetState();
    }

    getMapImageBuffer(mapId) {
        return this.#mapImageBuffers.get(mapId);
    }

    /**
     * Converts and stores the image buffer for a specific map.
     * @param {number} mapId - The ID of the map.
     * @param {Buffer} mapBuffer - The raw image buffer of the map.
     */
    setMapImageBuffer(mapId, mapBuffer) {
        const mapImageBuffer = ItemUtils.convertToImageBuffer(mapBuffer);

        if (this.getMapImageBuffer(mapId)?.toString() !== mapImageBuffer.toString()) {
            this.#mapImageBuffers.set(mapId, mapImageBuffer);
            this.frameMapManager.updateFrames(mapId);
            this.inventoryMapManager.setInventoryMapData({ mapId, mapImageBuffer });
        }
    }

    setEntityMapData(data) {
        this.frameMapManager.setEntityMapData(data);
    }

    deleteFrameMapData(frameId) {
        this.frameMapManager.deleteFrameMapData(frameId);
    }

    updateFrames(mapId) {
        this.frameMapManager.updateFrames(mapId);
    }

    updateInventoryMapData({ items, item, slot }) {
        this.inventoryMapManager.updateInventoryMapData({ items, item, slotId: slot });
    }
};

module.exports = MapManager;