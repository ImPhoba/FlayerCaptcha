const PacketHandler = require('./handlers/packetHandler');

class FlayerCaptcha extends PacketHandler {
    /** 
     * @param {object} bot - Bot instance.
     * @param {object} [config] - Handler config.
     * @param {number} [config.delay=10] - Delay in ms before final image assembly (between data extraction steps).
     * @param {boolean} [config.isStopped=false] - Pause data retrieval process.
     */
    constructor(bot, config = {}) {
        super(bot, { delay: 10, isStopped: false, ...config });
    }
}

module.exports = FlayerCaptcha;