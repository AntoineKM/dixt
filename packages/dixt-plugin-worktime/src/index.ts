import {
  CacheType,
  ChannelType,
  Colors,
  Events,
  GuildMember,
  Interaction,
  User,
} from "discord.js";
import { DixtPlugin, Log } from "dixt";
import dotenv from "dotenv-flow";
import WorktimeController from "./controller";

export const name = "dixt-plugin-worktime";

dotenv.config({
  silent: true,
});

export type DixtPluginWorktimeOptions = {
  channels?: {
    timeClock?: string | string[];
    leaderboard?: string;
    workChannelNames?: string[];
  };
  quotas?: {
    [x: string]: number;
  };
};

export const optionsDefaults = {
  channels: {
    timeClock: process.env.DIXT_PLUGIN_WORKTIME_TIME_CLOCK_CHANNEL_ID || "",
    leaderboard: process.env.DIXT_PLUGIN_WORKTIME_LEADERBOARD_CHANNEL_ID || "",
    workChannelNames:
      process.env.DIXT_PLUGIN_WORKTIME_WORK_CHANNEL_NAMES?.split(",") || [],
  },
};

const dixtPluginWorktime: DixtPlugin = (
  instance,
  optionsValue?: DixtPluginWorktimeOptions
) => {
  const options = { ...optionsDefaults, ...optionsValue };
  const controller = new WorktimeController(instance, options);
  if (!options.channels.timeClock) {
    Log.error(`${name} - channels.timeClock is required`);
    throw new Error(`${name} - channels.timeClock is required`);
  }

  instance.client.on(Events.ClientReady, async () => {
    if (!options.channels.timeClock) {
      Log.error(`${name} - channels.timeClock is required`);
      throw new Error(`${name} - channels.timeClock is required`);
    }

    if (Array.isArray(options.channels.timeClock)) {
      options.channels.timeClock.forEach((channelId) => {
        const channel = instance.client.channels.cache.get(channelId);
        if (channel?.type === ChannelType.GuildText) {
          controller.initialize(channel);
        } else {
          Log.error(
            `${name} - channel with id ${channelId} is not a text channel`
          );
        }
      });
    } else {
      const channel = instance.client.channels.cache.get(
        options.channels.timeClock
      );
      if (channel?.type === ChannelType.GuildText) {
        controller.initialize(channel);
      } else {
        Log.error(
          `${name} - channel with id ${options.channels.timeClock} is not a text channel`
        );
      }
    }
  });

  instance.client.on(
    Events.InteractionCreate,
    async (interaction: Interaction<CacheType>) => {
      if (!interaction.isButton()) return;
      if (!interaction.customId.startsWith("worktime_")) return;
      if (!interaction.guild) return;
      if (!interaction.member || !interaction.member.user) return;

      switch (interaction.customId) {
        case "worktime_start": {
          if (
            await controller.isInWorkChannel(interaction.member as GuildMember)
          ) {
            try {
              const embed = await controller.start(
                interaction.member.user as User
              );
              await interaction.reply({
                embeds: [embed],
                ephemeral: true,
              });
            } catch (e) {
              await interaction.reply({
                embeds: [
                  {
                    ...WorktimeController.baseEmbed,
                    color: Colors.Red,
                    description: `${interaction.member}, ${instance.messages?.error?.dmBlocked}`,
                  },
                ],
                ephemeral: true,
              });
              Log.error(`${interaction.member} - ${e}`);
            }
          } else {
            if (
              options.channels.workChannelNames &&
              options.channels.workChannelNames.length > 0
            ) {
              Log.info(
                `**${interaction.guild}** - ${interaction.member} tried to start worktime but is not in a work channel`
              );
              const workChannels = await controller.getWorkChannels();
              await interaction.reply({
                embeds: [
                  {
                    ...WorktimeController.baseEmbed,
                    description: `Connectez-vous au salon ${workChannels[0]} pour pointer votre arrivée.`,
                    color: Colors.Red,
                  },
                ],
                ephemeral: true,
              });
            }
          }
          break;
        }

        case "worktime_end": {
          try {
            const embed = await controller.end(interaction.member.user as User);
            await interaction.reply({
              embeds: [embed],
              ephemeral: true,
            });
          } catch (e) {
            await interaction.reply({
              embeds: [
                {
                  ...WorktimeController.baseEmbed,
                  color: Colors.Red,
                  description: `${interaction.member}, ${instance.messages?.error?.dmBlocked}`,
                },
              ],
              ephemeral: true,
            });
            Log.error(`${interaction.member} - ${e}`);
          }
          break;
        }
      }
    }
  );

  return {
    name,
  };
};

export default dixtPluginWorktime;
