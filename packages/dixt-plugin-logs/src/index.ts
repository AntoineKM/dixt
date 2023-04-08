import { MessageBuilder, Webhook } from "discord-webhook-node";
import { Colors, Events, TextChannel } from "discord.js";
import dixt, { dixtPlugin, reduceString, Log, LogType } from "dixt";
import dotenv from "dotenv-flow";

export const name = "dixt-plugin-logs";

dotenv.config({
  silent: true,
});

export type dixtPluginLogsOptions = {
  webhookUrl?: string;
  name?: string;
  avatarUrl?: string;
};

export const dixtPluginLogsDefaults = {
  webhookUrl: process.env.DIXT_PLUGIN_LOGS_WEBHOOK_URL || "",
  name,
};

const embedEmojis: {
  [K in LogType]: string;
} = {
  wait: "⏳",
  error: "❌",
  warn: "⚠️",
  ready: "✅",
  info: "📝",
  event: "📣",
};

const embedColors: {
  [K in LogType]: typeof Colors[keyof typeof Colors];
} = {
  wait: Colors.Yellow,
  error: Colors.Red,
  warn: Colors.Yellow,
  ready: Colors.Green,
  info: Colors.Blurple,
  event: Colors.Purple,
};

const dixtPluginLogs: dixtPlugin = (
  instance,
  optionsValue?: dixtPluginLogsOptions
) => {
  const options = { ...dixtPluginLogsDefaults, ...optionsValue };
  if (!options.webhookUrl) Log.error("No webhook url provided");

  const hook = new Webhook(options.webhookUrl);
  hook.setUsername(options.name);
  if (options.avatarUrl) hook.setAvatar(options.avatarUrl);

  const embed = new MessageBuilder();
  embed.setTimestamp();

  dixt.events.on("log", (log) => {
    try {
      embed.setDescription(
        reduceString(log.message.join(" ").toString(), 4096)
      );
      embed.setFooter(embedEmojis[log.type as LogType]);
      embed.setColor(embedColors[log.type as LogType]);

      hook.send(embed);
    } catch (error) {
      console.error(error);
    }
  });

  // handle when a guild member delete a message
  instance.client.on(Events.MessageDelete, (message) => {
    if (message.author?.bot) return;
    Log.warn(
      `**${message.guild}** - ${message.author} deleted a message in ${message.channel}:\n${message.cleanContent}`
    );
  });

  // handle when a guild member edit a message
  instance.client.on(Events.MessageUpdate, (oldMessage, newMessage) => {
    if (oldMessage.author?.bot) return;

    if ((oldMessage.channel as TextChannel)?.name.startsWith("access")) return;
    Log.warn(
      `**${oldMessage.guild}** - **${oldMessage.author}** edited a message in <#${oldMessage.channel.id}>:\n${oldMessage.cleanContent}\n⬇️\n${newMessage.cleanContent}`
    );
  });

  // handle when a guild member join the server
  instance.client.on(Events.GuildMemberAdd, (member) => {
    Log.info(`**${member.guild}** - ${member} has joined the server`);
  });

  // handle when a guild member leave the server
  instance.client.on(Events.GuildMemberRemove, (member) => {
    Log.info(`**${member.guild}** - ${member} has left the server`);
  });

  // handle when a member join a voice channel
  instance.client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    if (oldState.channelId === newState.channelId) return;
    if (oldState.channelId === null) {
      Log.info(
        `**${newState.guild}** - ${newState.member} has joined <#${newState.channelId}>`
      );
    } else if (newState.channelId === null) {
      Log.info(
        `**${oldState.guild}** - ${oldState.member} has left <#${oldState.channelId}>`
      );
    } else {
      Log.info(
        `**${newState.guild}** - ${newState.member} switch from <#${oldState.channelId}> to <#${newState.channelId}>`
      );
    }
  });

  // handle when someone change the role of someone
  instance.client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
    if (oldMember.roles.cache.size === newMember.roles.cache.size) return;
    if (oldMember.roles.cache.size > newMember.roles.cache.size) {
      const role = oldMember.roles.cache.find(
        (role) => !newMember.roles.cache.has(role.id)
      );
      Log.info(
        `**${newMember.guild}** - ${newMember.user} lost the role ${role}`
      );
    } else {
      const role = newMember.roles.cache.find(
        (role) => !oldMember.roles.cache.has(role.id)
      );
      Log.info(
        `**${newMember.guild}** - ${newMember.user} got the role ${role}`
      );
    }
  });

  // handle when someone change the nickname of someone
  instance.client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
    if (oldMember.nickname === newMember.nickname) return;
    Log.info(
      `**${newMember.guild}** - ${newMember.user} changed his nickname from ${
        oldMember.nickname || oldMember.user.username
      } to ${newMember.nickname || newMember.user.username}`
    );
  });

  // handle when someone react to a message
  instance.client.on(Events.MessageReactionAdd, (reaction, user) => {
    if (user.bot) return;
    Log.info(
      `**${
        reaction.message.guild
      }** - **${user}** reacted to ${`https://discord.com/channels/${reaction.message.guild?.id}/${reaction.message.channel.id}/${reaction.message.id}`} with ${
        reaction.emoji
      }`
    );
  });

  // handle when someone remove a reaction from a message
  instance.client.on(Events.MessageReactionRemove, (reaction, user) => {
    if (user.bot) return;
    Log.info(
      `**${
        reaction.message.guild
      }** - **${user}** removed his reaction to ${`https://discord.com/channels/${reaction.message.guild?.id}/${reaction.message.channel.id}/${reaction.message.id}`} with ${
        reaction.emoji
      }`
    );
  });

  // handle when someone use a slash command
  instance.client.on(Events.InteractionCreate, (interaction) => {
    if (interaction.isCommand()) {
      Log.info(
        `**${interaction.guild ?? "DM"}**`,
        `member **${interaction.user.username}#${interaction.user.discriminator}** excuted the command ` +
          "`" +
          `/${interaction.commandName} ${interaction.options.data
            .map((option) => option.name + ":" + option.value)
            .join(" ")}` +
          "`"
      );
    }
  });

  return {
    name,
  };
};

export default dixtPluginLogs;
