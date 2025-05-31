class EntityUtils {
    static #frames = new Set([
        'ItemFrame',
        'item_frame',
        'item_frames',
        'glow_item_frame'
    ]);

    static #reverseDirections = {
        'up': 'down',
        'down': 'up',
        'south': 'north',
        'west': 'east',
        'north': 'south',
        'east': 'west'
    };

    static #relativeDirections = {
        north: { north: 'forward', south: 'back', west: 'left', east: 'right' },
        south: { south: 'forward', north: 'back', east: 'left', west: 'right' },
        west: { west: 'forward', east: 'back', south: 'left', north: 'right' },
        east: { east: 'forward', west: 'back', north: 'left', south: 'right' }
    };

    static getMinDistance(position, coordinates) {
        let minDistance = Infinity;
        for (const coordinate of coordinates.keys()) {
            const distance = this.distance(position, coordinate);
            if (distance < minDistance) {
                minDistance = distance;
            }
        }
        return minDistance;
    }

    static getFacing(botEntity, frameViewDirection) {
        const { horizontalDirection } = this.getViewDirection(botEntity.yaw, botEntity.pitch);

        if (frameViewDirection == 'up' || frameViewDirection == 'down') {
            return this.#reverseDirections[frameViewDirection];
        } else if (horizontalDirection == 'up' || horizontalDirection == 'down') {
            return this.#reverseDirections[horizontalDirection];
        }

        return this.#facing(horizontalDirection, frameViewDirection);
    }


    static getViewDirection(yaw, pitch) {
        let yawDeg = 180 - (yaw * (180 / Math.PI));
        if (yawDeg > 180) yawDeg -= 360;
        if (yawDeg < -180) yawDeg += 360;
        yawDeg = Math.round(yawDeg);

        const pitchDeg = Math.round(-pitch * (180 / Math.PI));
        const verticalDirection =
            pitchDeg >= 60 ? 'down' :
                pitchDeg <= -60 ? 'up' :
                    false;

        let horizontalDirection;
        if (yawDeg >= -45 && yawDeg <= 44.9) horizontalDirection = 'south';
        else if (yawDeg >= 45 && yawDeg <= 134.9) horizontalDirection = 'west';
        else if (yawDeg >= -135 && yawDeg <= -45.1) horizontalDirection = 'east';
        else horizontalDirection = 'north';

        return { horizontalDirection, verticalDirection };
    }

    static isEntityFrame(bot, entityType) {
        const entityName = bot.registry.entities[entityType]?.name;
        return this.#frames.has(entityName);
    }

    static distance(pos1, pos2) {
        return Math.sqrt(
            (pos1.x - pos2.x) ** 2 +
            (pos1.y - pos2.y) ** 2 +
            (pos1.z - pos2.z) ** 2
        );
    }

    static #facing(playerViewDirection, frameViewDirection) {
        return this.#relativeDirections[playerViewDirection]?.[this.#reverseDirections[frameViewDirection]];
    }
};

module.exports = EntityUtils;