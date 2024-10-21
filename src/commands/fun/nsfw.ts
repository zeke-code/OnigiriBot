import {
  SlashCommandBuilder,
  EmbedBuilder,
  CommandInteraction,
} from "discord.js";
import axios from "axios";
import logger from "../../utils/logger";

const nsfwGifsPaths: string[] = [
  "anal",
  "blowjob",
  "cum",
  "fuck",
  "neko",
  "pussylick",
  "solo",
  "yaoi",
  "yuri",
  "threesome_fff",
  "threesome_ffm",
  "threesome_mmf",
];

const nsfwCommand = {
  data: new SlashCommandBuilder()
    .setName("nsfw")
    .setDescription("Sends a random hentai NSFW GIF in your channel... 😳")
    .setNSFW(true),

  async execute(interaction: CommandInteraction) {
    try {
      const randomWord =
        nsfwGifsPaths[Math.floor(Math.random() * nsfwGifsPaths.length)];
      const response = await axios.get(
        `https://purrbot.site/api/img/nsfw/${randomWord}/gif`
      );
      const url = response.data?.link;

      if (!url) {
        throw new Error("URL wasn't found after GET request in NSFW command.");
      }

      const embed = new EmbedBuilder().setImage(url).setColor("#ffffff");
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error(
        `Error while trying to retrieve NSFW image from API: ${error}`
      );
      await interaction.reply({
        content: "Something went wrong with the request. Try again",
        ephemeral: true,
      });
    }
  },
};

export default nsfwCommand;
