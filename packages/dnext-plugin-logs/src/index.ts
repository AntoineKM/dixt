import { MessageBuilder, Webhook } from "discord-webhook-node";
import { Colors } from "discord.js";
import dnext, { dnextPlugin, reduceString, Log, LogType } from "dnext";
import dotenv from "dotenv-flow";

export const name = "dnext-plugin-logs";

dotenv.config({
  silent: true,
});

export type dnextPluginLogsOptions = {
  webhookUrl?: string;
  name?: string;
  avatarUrl?: string;
};

export const dnextPluginLogsDefaults = {
  webhookUrl: process.env.DNEXT_PLUGIN_LOGS_WEBHOOK_URL || "",
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

const dnextPluginLogs: dnextPlugin = (
  _,
  optionsValue?: dnextPluginLogsOptions
) => {
  const options = { ...dnextPluginLogsDefaults, ...optionsValue };
  if (!options.webhookUrl) Log.error("No webhook url provided");

  const hook = new Webhook(options.webhookUrl);
  hook.setUsername(options.name);
  if (options.avatarUrl) hook.setAvatar(options.avatarUrl);

  const embed = new MessageBuilder();
  embed.setTimestamp();

  dnext.events.on("log", (log) => {
    try {
      embed.setDescription(reduceString(log.message.toString(), 4096));
      embed.setFooter(embedEmojis[log.type as LogType]);
      embed.setColor(embedColors[log.type as LogType]);

      hook.send(embed);
    } catch (error) {
      console.error(error);
    }
  });

  return {
    name,
  };
};

export default dnextPluginLogs;
