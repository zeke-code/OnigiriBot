const { Events, ActivityType } = require("discord.js");
const logger = require("../utils/logger");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logger.info(`Ready! Logged in as ${client.user.tag}`);
    client.user.setActivity("Glad to serve you! (˶ᵔ ᵕ ᵔ˶)", {
      type: ActivityType.Custom,
    });
  },
};
