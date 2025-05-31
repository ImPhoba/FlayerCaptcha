const MapManager = require('../managers/mapManager');
const EntityUtils = require('../utils/entityUtils');
const ItemUtils = require('../utils/itemUtils');

class PacketHandler extends MapManager {
    #isStopped = false;

    constructor(bot, config) {
        super(config.delay);
        this.bot = bot;
        this.#isStopped = config.isStopped;

        this.bot._client.on('login', () => this.#login());
        this.bot._client.on('packet', (packet) => {
            if (!this.#isStopped) this.#packet(packet);
        });
        this.bot._client.on('entity_metadata', (packet) => {
            if (!this.#isStopped) this.#entityMetadata(packet);
        });
    }

    stop() { this.#updateState(true); }
    resume() { this.#updateState(false); }

    #updateState(isStopped) {
        if (this.#isStopped !== isStopped) {
            this.#isStopped = isStopped;
            this.resetState();
        }
    }

    #login() {
        this.resetState();
        this.metadataKeys = ItemUtils.getMetadataKeys(this.bot);
    }

    #packet({ itemDamage, data, ...packet } = {}) {
        // Received a map image
        if (data && typeof itemDamage === 'number') {
            this.setMapImageBuffer(itemDamage, data);
        }
        // Item added to inventory or on spawn with items
        else if (packet.windowId === 0) {
            this.updateInventoryMapData(packet);
        }
        // Entities disappeared from visible area
        else if (packet.entityIds) {
            packet.entityIds.forEach(id => {
                this.deleteFrameMapData(id);
            });
        }
    }

    /**
     * Handles updates to entity metadata and updates frame data if necessary.
     * @param {Object} params - The entity metadata packet.
     * @param {number} params.entityId - The ID of the entity.
     * @param {Array<Object>} params.metadata - The metadata array for the entity.
     */
    #entityMetadata({ entityId, metadata }) {
        const entity = this.bot.entities[entityId];
        if (!entity || !EntityUtils.isEntityFrame(this.bot, entity.entityType)) return;

        const oldMapItem = entity.metadata.find(meta => ItemUtils.isFilledMap(this.bot, meta));
        const newMapItem = metadata.find(v => v.key === this.metadataKeys.item)?.value;
        const isFilledMap = ItemUtils.isFilledMap(this.bot, newMapItem);
        if (!oldMapItem && !isFilledMap) return;

        const mapId = ItemUtils.getValueOfFilledMap(oldMapItem || newMapItem);
        if (mapId == null) return;

        const { position, yaw, pitch } = entity;
        const { horizontalDirection, verticalDirection } = EntityUtils.getViewDirection(yaw, pitch);
        const viewDirection = verticalDirection || horizontalDirection;

        if (newMapItem && !isFilledMap) {
            const frameIds = this.frameMapManager.getEntityFrameIdsByMapId(mapId);
            for (const frameId of frameIds) {
                const frameData = this.frameMapManager.getEntityFrameData(frameId);
                if (frameData && frameData.viewDirection == viewDirection &&
                    JSON.stringify(frameData.coordinate) === JSON.stringify(position)) {
                    this.deleteFrameMapData(frameId);
                    break
                }
            }
        } else {
            const itemRotate = metadata.find(v => v.key === this.metadataKeys.rotate)?.value;
            const entityRotate = entity.metadata[this.metadataKeys.rotate];
            this.setEntityMapData({
                entityFrameId: entityId,
                mapId,
                rotate: itemRotate ?? entityRotate ?? 0,
                coordinate: position,
                viewDirection,
                nbtData: newMapItem && newMapItem.nbtData || oldMapItem && oldMapItem.nbtData || null
            });
        }
    }
};

module.exports = PacketHandler;