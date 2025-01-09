const sortCoordinatesByProximity = (coords) => {
    const isNeighbor = (p1, p2) => Math.abs(p1.x - p2.x) <= 1 && Math.abs(p1.y - p2.y) <= 1 && Math.abs(p1.z - p2.z) <= 1;

    const groups = [];
    const visited = new Set();

    const findGroup = (index, group) => {
        visited.add(index);
        group.push(coords[index]);
        for (let i = 0; i < coords.length; i++) {
            if (!visited.has(i) && isNeighbor(coords[index], coords[i])) {
                findGroup(i, group);
            }
        }
    };

    for (let i = 0; i < coords.length; i++) {
        if (!visited.has(i)) {
            const group = [];
            findGroup(i, group);
            groups.push(group);
        }
    }

    return groups.sort((a, b) => {
        const distance = (point) => Math.sqrt(point.x ** 2 + point.y ** 2 + point.z ** 2);
        const minDistance = (group) => Math.min(...group.map(distance));
        return minDistance(a) - minDistance(b);
    });
};

module.exports = sortCoordinatesByProximity;