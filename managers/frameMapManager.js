const ImageHandler = require('../handlers/imageHandler');

class FrameMapManager extends ImageHandler {
    /**
     * Maps mapId to a set of frameIds that contain this map.
     * Key — mapId (number), Value — Set of entityFrameId (number).
     * @type {Map<number, Set<number>>}
     */
    #mapToEntityFrameIds = new Map();

    /**
     * Stores data for entity frames.
     * Key - The ID of the entity frame.
     * Value - An object containing frame properties:
     *   - mapId: The ID of the map (the item inside the frame).
     *   - rotate: The rotation of the item inside the frame.
     *   - coordinate: The coordinates of the frame entity.
     *   - viewDirection: The direction the frame is looking towards.
     *   - nbtData: Metadata of the item inside the frame.
     * @type {Map<number, {entityFrameId: number, mapId: number, rotate: number, coordinate: object, viewDirection: string, nbtData: object}>}
     */
    #entityFramesData = new Map();

    /**
     * Stores initiators for each view direction. 
     */
    #iniziators = new Map();

    /**
     * Stores timeout IDs for each view direction. 
     */
    #timeoutIds = {};

    constructor(mapManager) {
        super();
        this.mapManager = mapManager;
    }

    resetState() {
        Object.entries(this.#timeoutIds).forEach(timeoutId => {
            clearTimeout(this.#timeoutIds[timeoutId]);
        });
        this.#timeoutIds = {};
        this.#mapToEntityFrameIds.clear();
        this.#entityFramesData.clear();
        this.#iniziators.clear();
    }

    getEntityFrameIdsByMapId(mapId) {
        return this.#mapToEntityFrameIds.get(mapId);
    }

    getEntityFrameData(frameId) {
        return this.#entityFramesData.get(frameId);
    }

    getFrameInfo(frameId) {
        const frameData = this.getEntityFrameData(frameId);
        const mapImageBuffer = this.mapManager.getMapImageBuffer(frameData?.mapId);
        return { frameData, mapImageBuffer };
    }

    getIniziators(viewDirection) {
        return this.#iniziators.get(viewDirection);
    }

    /**
     * Saves data for an entity frame.
     * @param {Object} params
     * @param {number} params.entityFrameId - The ID of the entity frame.
     * @param {number} params.mapId - ID of the map inside the frame.
     * @param {number} params.rotate - Rotation of the item.
     * @param {object} params.coordinate - Coordinates of the frame entity.
     * @param {string} params.viewDirection - Direction the frame is facing.
     * @param {string} params.nbtData - Metadata of the item inside the frame.
     */
    setEntityMapData({ entityFrameId, mapId, rotate, coordinate, viewDirection, nbtData }) {
        this.#entityFramesData.set(entityFrameId, {
            entityFrameId,
            mapId,
            rotate,
            coordinate,
            viewDirection,
            nbtData
        });

        if (!this.#mapToEntityFrameIds.has(mapId)) {
            this.#mapToEntityFrameIds.set(mapId, new Set());
        }

        this.#mapToEntityFrameIds.get(mapId).add(entityFrameId);
        this.#updateFrame(entityFrameId);
    }

    deleteFrameMapData(frameId) {
        if (this.#entityFramesData.has(frameId)) {
            const { viewDirection, coordinate } = this.getEntityFrameData(frameId);

            this.#entityFramesData.delete(frameId);
            if (this.#timeoutIds[viewDirection]) {
                clearTimeout(this.#timeoutIds[viewDirection])
            }

            this.#timeoutIds[viewDirection] = setTimeout(() => {
                this.processFrames(this.#entityFramesData, viewDirection, coordinate);
            }, this.mapManager.delay);
        }
    }

    updateFrames(mapId) {
        const frameIds = this.#mapToEntityFrameIds.get(mapId);
        if (frameIds) {
            for (const id of frameIds) {
                this.#updateFrame(id);
            }
        }
    }

    #updateFrame(frameId) {
        this.#processFrameInfo(frameId);
    }

    #processFrameInfo(entityFrameId) {
        const frameInfo = this.getFrameInfo(entityFrameId);
        const { frameData, mapImageBuffer } = frameInfo;

        if (!mapImageBuffer) return;
        const { viewDirection, rotate, coordinate } = frameData;

        if (this.#timeoutIds[viewDirection]) {
            clearTimeout(this.#timeoutIds[viewDirection])
        }

        this.#timeoutIds[viewDirection] = setTimeout(() => {
            this.processFrames(this.#entityFramesData, viewDirection);
        }, this.mapManager.delay);

        const image = this.createImage(mapImageBuffer, rotate);

        this.emit('frameInfo', { ...frameInfo, image });

        if (!this.#iniziators.has(viewDirection)) {
            this.#iniziators.set(viewDirection, new Set());
        }

        this.#iniziators.get(viewDirection).add(JSON.stringify(coordinate));
    }
};

module.exports = FrameMapManager;