const colorData = require('./captcha/colors.json');
const colorMap = new Map(Object.entries(colorData));

const frames = new Set([
    'ItemFrame',
    'item_frame',
    'item_frames',
    'glow_item_frame'
]);

function isEntityFrame(bot, entityType) {
    const entityName = bot.registry.entities[entityType]?.name;
    return frames.has(entityName);
}

function isFilledMap(bot, item) {
    if (!item) return;

    const itemId = item.itemId || item.blockId;
    const itemName = bot.registry.items[itemId]?.name;

    //  fix for version 1.13.1
    return bot.version == '1.13.1' ?
        itemName == 'melon_seeds' :
        itemName == 'filled_map';
}

function getMetadataKeys(bot) {
    const version = bot.registry.version;
    if (version['<=']('1.8.9') || version['>=']('1.17')) return { rotate: 9, item: 8 };
    if (version['>=']('1.14') && version['<=']('1.16.5')) return { rotate: 8, item: 7 };
    if (version['>=']('1.10') && version['<=']('1.13.2')) return { rotate: 7, item: 6 };
    if (version['>=']('1.9') && version['<=']('1.9.4')) return { rotate: 6, item: 5 };
}

function getValueOfFilledMap(item) {
    return item.itemDamage ??                                   //  1.8-1.13.1
        item.nbtData?.value?.map?.value ??                      //  1.13.2-1.20.4
        item.components?.find(v => v.type === 'map_id').data ?? //  1.20.5+
        0;                                                      //  default
}

function getImageBuffer(buffer) {
    const imgBuf = new Uint8ClampedArray(65536);
    const view = new DataView(imgBuf.buffer);
    let offset = 0;

    for (let i = 0; i < buffer.length; i++) {
        const color = colorMap.get(String(buffer[i]));
        view.setUint8(offset++, color[0]);
        view.setUint8(offset++, color[1]);
        view.setUint8(offset++, color[2]);
        view.setUint8(offset++, color[3]);
    }
    return imgBuf;
}

const directions = new Map([
    ['3 2', 'up'],
    ['3 -2', 'down'],
    ['3 0', 'south'],
    ['2 0', 'west'],
    ['0 0', 'north'],
    ['5 0', 'east'],
]);

function getViewDirection(yaw, pitch) {
    const key = `${Math.round(yaw)} ${Math.round(pitch)}`;
    return directions.get(key);
}

module.exports = {
    isEntityFrame,
    isFilledMap,
    getMetadataKeys,
    getValueOfFilledMap,
    getImageBuffer,
    getViewDirection
};