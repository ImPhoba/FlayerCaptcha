const colorData = require('./captcha/colors.json');

class ItemUtils {
    static #colorMap = new Map(Object.entries(colorData));

    static getMetadataKeys(bot) {
        const version = bot.registry.version;
        if (version['<=']('1.8.9') || version['>=']('1.17')) return { rotate: 9, item: 8 };
        if (version['>=']('1.14') && version['<=']('1.16.5')) return { rotate: 8, item: 7 };
        if (version['>=']('1.10') && version['<=']('1.13.2')) return { rotate: 7, item: 6 };
        if (version['>=']('1.9') && version['<=']('1.9.4')) return { rotate: 6, item: 5 };
    }

    static getValueOfFilledMap(item) {
        return item.itemDamage ??                                       //  1.8-1.13.1
            item.nbtData?.value?.map?.value ??                          //  1.13.2-1.20.4
            item.components?.find(v => v.type === 'map_id')?.data ??    //  1.20.5+
            null;                                                       //  default
    }

    static isFilledMap(bot, item) {
        if (typeof item !== 'object') return false;

        const itemId = item.itemId || item.blockId;
        const itemName = bot.registry.items[itemId]?.name;

        //  fix for version 1.13.1
        return bot.version == '1.13.1' ?
            itemName == 'melon_seeds' :
            itemName == 'filled_map';
    }

    static convertToImageBuffer(mapBuffer) {
        const imageBuffer = new Uint8ClampedArray(65536);
        const view = new DataView(imageBuffer.buffer);
        let offset = 0;

        for (let i = 0; i < mapBuffer.length; i++) {
            const color = this.#colorMap.get(String(mapBuffer[i]));
            view.setUint8(offset++, color[0]);
            view.setUint8(offset++, color[1]);
            view.setUint8(offset++, color[2]);
            view.setUint8(offset++, color[3]);
        }

        return imageBuffer;
    }
};

module.exports = ItemUtils;