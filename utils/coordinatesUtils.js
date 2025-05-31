class CoordinatesUtils {
    static #keys = {
        north: 'z',
        south: 'z',
        east: 'x',
        west: 'x',
        up: 'y',
        down: 'y',
    };

    static sortCoordinates(dataMaps, viewDirection) {
        const key = this.#getKey(viewDirection);
        const coords = Array.from(dataMaps.keys());

        const grouped = coords.reduce((acc, coord) => {
            const k = coord[key];
            if (!acc[k]) acc[k] = [];
            acc[k].push(coord);
            return acc;
        }, {});

        const finalGroups = [];

        for (const group of Object.values(grouped)) {
            const visited = new Set();

            const findGroup = (coord, groupList) => {
                visited.add(coord);
                groupList.push(coord);
                for (const neighbor of group) {
                    if (!visited.has(neighbor) && this.isNeighbor(coord, neighbor, viewDirection)) {
                        findGroup(neighbor, groupList);
                    }
                }
            };

            for (const coord of group) {
                if (!visited.has(coord)) {
                    const cluster = [];
                    findGroup(coord, cluster);
                    finalGroups.push(cluster);
                }
            }
        }

        const distance = (point) => Math.sqrt(point.x ** 2 + point.y ** 2 + point.z ** 2);
        const minDistance = (group) => Math.min(...group.map(distance));

        finalGroups.sort((a, b) => minDistance(a) - minDistance(b));
        return finalGroups;
    }

    static isNeighbor(pos1, pos2, viewDirection) {
        const dx = Math.abs(pos1.x - pos2.x);
        const dy = Math.abs(pos1.y - pos2.y);
        const dz = Math.abs(pos1.z - pos2.z);

        if (dx + dy + dz !== 1) return false;

        if (viewDirection == 'up' || viewDirection == 'down') return dy == 0;
        if (viewDirection == 'east' || viewDirection == 'west') return dx == 0;
        if (viewDirection == 'south' || viewDirection == 'north') return dz == 0;
    }

    static #getKey(viewDirection) {
        return this.#keys[viewDirection];
    }
};

module.exports = CoordinatesUtils;