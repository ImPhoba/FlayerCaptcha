class ImageUtils {
    static mapSize = 128;

    static #sortAsc = (a, b) => a - b;
    static #sortDesc = (a, b) => b - a;

    static #directionHeightKeys = {
        down: 'z',
        up: 'z',
        south: 'y',
        west: 'y',
        north: 'y',
        east: 'y'
    };

    static #specialDirections = new Set(['south', 'west']);

    static getImageMapping(data, viewDirection) {
        const { widthData, heightData } = this.#getImageData(data, viewDirection);

        const sortOrderWidth = this.#specialDirections.has(viewDirection) ? this.#sortAsc : this.#sortDesc;
        const sortOrderHeight = this.#sortDesc;

        return {
            widthMapping: this.#createMapping(widthData, sortOrderWidth),
            heightMapping: this.#createMapping(heightData, sortOrderHeight)
        };
    }

    static getImageSize(data, viewDirection) {
        const { widthData, heightData } = this.#getImageData(data, viewDirection);
        return {
            width: this.#getSize(widthData),
            height: this.#getSize(heightData)
        };
    }

    static getImageKeys(data, viewDirection) {
        const heightKey = this.#directionHeightKeys[viewDirection];
        return {
            heightKey,
            widthKey: heightKey === 'y' && new Set(data.x).size == 1 ? 'z' : 'x'
        };
    }

    static #getSize(values) {
        const uniqueValues = [...new Set(values)];
        const max = Math.max(...uniqueValues);
        const min = Math.min(...uniqueValues);
        const value = Math.abs(max - min) + 1;
        return value * this.mapSize;
    }

    static #getImageData(data, viewDirection) {
        const { widthKey, heightKey } = this.getImageKeys(data, viewDirection);
        return {
            widthData: data[widthKey],
            heightData: data[heightKey]
        };
    }

    static #createMapping(values, sortOrder) {
        const uniqueValues = [...new Set(values)];
        const sortedValues = uniqueValues.sort(sortOrder);
        return new Map(sortedValues.map((value, index) => [value, index * this.mapSize]));
    }
};

module.exports = ImageUtils;