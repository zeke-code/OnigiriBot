const { Events } = require("discord.js");
const logger = require("../utils/logger");

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const guild = member.guild;
    const channel = guild.systemChannel;
    const userId = member.id;
    const mention = `<@${userId}>`;

    if (channel) {
      channel.send(`Hey, welcome to our server, ${mention}!`);
    } else
      logger.info(
        `Didn\'t find a system channel for guild ${guild}, not sending any welcome message.`
      );
  },
};
