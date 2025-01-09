const { isFilledMap, isEntityFrame, getValueOfFilledMap, getViewDirection } = require('./itemUtils');

function initializations() {

    this.bot._client.on('login', () => this.resetState())

    this.bot._client.on('packet', async (packet) => {
        if (!packet || this.isStopped) return;

        const { itemDamage, data, item, entityIds } = packet;

        if (data && typeof itemDamage == 'number') {
            this.updateDataMaps({ id: itemDamage, value: data, key: "buf" });
        } else if (isFilledMap(this.bot, item)) {
            const id = getValueOfFilledMap(item);
            this.updateDataMaps({ id, value: { x: 0, y: 0, z: 0 }, key: "pos", rotate: 0, viewDirection: 'inventory' });
        } else if (entityIds) {
            entityIds.forEach(entityId => this.processingKeyDelete({ entityId }));
        }
    })

    this.bot._client.on('entity_metadata', async ({ entityId, metadata }) => {
        if (this.isStopped) return;

        const entity = this.bot.entities[entityId];
        if (!entity || !isEntityFrame(this.bot, entity.entityType)) return;

        let { position, yaw, pitch } = entity;
        const viewDirection = getViewDirection(yaw, pitch);
        const rotate = metadata.find(v => v.key === this.metadataKeys.rotate)?.value || 0;
        const itemMetadata = metadata.find(v => v.key === this.metadataKeys.item)?.value;

        if (itemMetadata) {
            if (isFilledMap(this.bot, itemMetadata)) {
                const id = getValueOfFilledMap(itemMetadata);
                this.updateDataMaps({ id, value: position, key: "pos", rotate, viewDirection, entityId });
            } else if (!itemMetadata.present) {
                this.processingKeyDelete({ value: position, viewDirection });
            }
        } else {
            entity.metadata.forEach(metadata => {
                if (typeof metadata != 'object' || !isFilledMap(this.bot, metadata)) return;
                const id = getValueOfFilledMap(metadata);
                this.updateDataMaps({ id, value: position, key: "rotate", rotate, viewDirection });
            });
        }
    })
}

module.exports = initializations;