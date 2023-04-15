import { APIEmbed, Events, TextChannel } from "discord.js";
import { DixtPlugin, Log } from "dixt";
import dotenv from "dotenv-flow";

export const name = "dixt-plugin-join";

dotenv.config({
  silent: true,
});

export type DixtPluginJoinOptions = {
  channel?: string;
  emoji?: string;
  message?: string;
};

export const optionsDefaults = {
  channel: process.env.DIXT_PLUGIN_JOIN_CHANNEL_ID || "",
  emoji: "🆕",
  message: "has joined the server !",
};

const dixtPluginJoin: DixtPlugin = (
  instance,
  optionsValue?: DixtPluginJoinOptions
) => {
  const options = { ...optionsDefaults, ...optionsValue };
  if (!options.channel) {
    Log.error(`${name} - channel is required`);
    throw new Error(`${name} - channel is required`);
  }

  instance.client.on(Events.GuildMemberAdd, async (member) => {
    const channel = (await member.guild.channels.fetch(
      options.channel
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
