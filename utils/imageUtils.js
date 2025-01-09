function getSize(values) {
    const uniqueValues = [...new Set(values)];
    const max = Math.max(...uniqueValues);
    const min = Math.min(...uniqueValues);
    const value = Math.abs(max - min) + 1;
    return value * 128;
}

function createMapping(values, sortOrder) {
    const uniqueValues = [...new Set(values)];
    const sortedValues = uniqueValues.sort(sortOrder);
    return new Map(sortedValues.map((value, index) => [value, index * 128]));
}

function getImageData(data, viewDirection) {
    const { widthKey, heightKey } = getImageKeys(data, viewDirection);
    const widthData = data[widthKey];
    const heightData = data[heightKey];
    return { widthData, heightData };
}

function getImageKeys(data, viewDirection) {
    if (viewDirection == 'inventory') return { widthKey: 'x', heightKey: 'y' };
    if (['down', 'up'].includes(viewDirection)) return { widthKey: 'x', heightKey: 'z' };

    const widthKey = new Set(data.x).size == 1 ? 'z' : 'x';
    return { widthKey, heightKey: 'y' };
}

function getImageSize(data, viewDirection) {
    if (viewDirection == 'inventory') {
        return { width: 128, height: 128 }
    };

    const { widthData, heightData } = getImageData(data, viewDirection);
    const width = getSize(widthData);
    const height = getSize(heightData);
    return { width, height };
}

function getImageMapping(data, viewDirection) {
    if (viewDirection == 'null') {
        return { widthMapping: new Map([[0, 0]]), heightMapping: new Map([[0, 0]]) }
    };

    const { widthData, heightData } = getImageData(data, viewDirection);
    const { heightKey } = getImageKeys(data, viewDirection);
    const isSpecialDirection = viewDirection == 'down' || heightKey == 'y' && ['south', 'west'].includes(viewDirection);

    const sortOrderWidth = isSpecialDirection ? (a, b) => a - b : (a, b) => b - a;
    const sortOrderHeight = (a, b) => b - a;

    const widthMapping = createMapping(widthData, sortOrderWidth);
    const heightMapping = createMapping(heightData, sortOrderHeight);

    return { widthMapping, heightMapping };
}

module.exports = {
    getImageKeys,
    getImageSize,
    getImageMapping
};