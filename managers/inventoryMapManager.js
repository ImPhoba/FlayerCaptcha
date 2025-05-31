const ImageHandler = require('../handlers/imageHandler');
const ItemUtils = require('../utils/itemUtils');

class InventoryMapManager extends ImageHandler {
    #mapToInventorySlotIds = new Map();
    #inventoryData = new Map();

    constructor(mapManager) {
        super();
        this.mapManager = mapManager;
    }

    resetState() {
        this.#mapToInventorySlotIds.clear();
        this.#inventoryData.clear();
    }

    setInventoryMapData({ mapId, mapImageBuffer, slotId, item }) {
        if (typeof mapId === 'number') {
            this.#processInventoryInfo(mapImageBuffer, mapId);
        } else if (ItemUtils.isFilledMap(this.mapManager.bot, item)) {
            this.#inventoryData.set(slotId, {
                slotId,
                item
            });

            const mapId = ItemUtils.getValueOfFilledMap(item);
            if (!this.#mapToInventorySlotIds.has(mapId)) {
                this.#mapToInventorySlotIds.set(mapId, new Set());
            }

            this.#mapToInventorySlotIds.get(mapId).add(slotId);

            const mapImageBuffer = this.mapManager.getMapImageBuffer(mapId);
            this.#processInventoryInfo(mapImageBuffer, mapId, slotId);
        } else {
            this.#inventoryData.delete(slotId);
        }
    }

    updateInventoryMapData({ items, item, slotId }) {
        if (items) {
            for (const [slotId, item] of items.entries()) {
                this.setInventoryMapData({ slotId, item });
            }
        } else {
            this.setInventoryMapData({ slotId, item });
        }
    }

    #processInventoryInfo(mapImageBuffer, mapId, slotId) {
        if (mapImageBuffer && this.#mapToInventorySlotIds.has(mapId)) {
            const slots = [];
            if (typeof slotId === 'number') {
                const slot = this.#inventoryData.get(slotId);
                slots.push(slot);
            } else {
                const slotIds = this.#mapToInventorySlotIds.get(mapId);
                for (const id of slotIds) {
                    const slot = this.#inventoryData.get(id);
                    slots.push(slot);
                }
            }

            const image = this.createImage(mapImageBuffer);
            this.emit('inventoryInfo', {
                data: {
                    slots,
                    mapId
                },
                image
            });
        }
    }
};

module.exports = InventoryMapManager;