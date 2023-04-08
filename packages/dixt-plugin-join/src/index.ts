import { APIEmbed, Events, TextChannel } from "discord.js";
import { dixtPlugin, Log } from "dixt";
import dotenv from "dotenv-flow";

export const name = "dixt-plugin-join";

dotenv.config({
  silent: true,
});

export type dixtPluginJoinOptions = {
  channelId?: string;
  emoji?: string;
  message?: string;
};

export const optionsDefaults = {
  channelId: process.env.DIXT_PLUGIN_JOIN_CHANNEL_ID || "",
  emoji: "🆕",
  message: "has joined the server !",
};

const dixtPluginJoin: dixtPlugin = (
  instance,
  optionsValue?: dixtPluginJoinOptions
) => {
  const options = { ...optionsDefaults, ...optionsValue };
  if (!options.channelId) {
    Log.error(`${name} - channelId is required`);
    throw new Error(`${name} - channelId is required`);
  }

  instance.client.on(Events.GuildMemberAdd, async (member) => {
    const channel = (await member.guild.channels.fetch(
      options.channelId
    )) as TextChannel;

    const embed: APIEmbed = {
      description: `${options.emoji} **${member.user.username}#${member.user.discriminator}** ${options.message}`,
    };

    channel.send({ embeds: [embed] });
  });

  return {
    name,
  };
};

export default dixtPluginJoin;
