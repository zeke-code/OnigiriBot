const { Events } = require("discord.js");
const logger = require("../utils/logger");
const Guild = require("../database/models/Guild");
const User = require("../database/models/User");

// Upon joining a new server, register it and its correlated users to the database.
module.exports = {
  name: Events.GuildCreate,
  async execute(guild) {
    logger.info(`Joined a new guild: ${guild.name}`);

    try {
      let existingGuild = await Guild.findOne({ guildId: guild.id });

      if (!existingGuild) {
        const newGuild = new Guild({
          guildId: guild.id,
          guildName: guild.name,
        });

        existingGuild = await newGuild.save();
        logger.info(`Guild ${guild.name} has been added to the database.`);
      } else {
        logger.info(`Guild ${guild.name} already exists in the database.`);
      }

      await guild.members.fetch();

      guild.members.cache.forEach(async (member) => {
        if (member.user.bot) return;

        let user = await User.findOne({ userId: member.id });

        if (!user) {
          const newUser = new User({
            userId: member.id,
            userName: member.user.username,
            joinedAt: member.joinedAt || new Date(),
            roles: member.roles.cache.map((role) => role.name),
            warnings: 0,
            guildId: existingGuild._id,
          });

          await newUser.save();
          logger.info(`User ${member.user.username} added to the database.`);
        } else {
          logger.info(
            `User ${member.user.username} already exists in the database.`
          );
        }
      });

      logger.info(`All users from guild "${guild.name}" have been processed.`);
    } catch (error) {
      logger.error(`Error processing guild "${guild.name}": ${error}`);
    }
  },
};
