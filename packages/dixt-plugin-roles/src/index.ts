import { CacheType, Events, Interaction, User } from "discord.js";
import { DixtPlugin, Log, getTextChannel, merge } from "dixt";

import { name } from "../package.json";
import RolesController from "./controllers/roles";

export type DixtPluginRolesOptionsChannelRole = {
  id: string;
  emoji: string;
  description?: string;
  message?: string;
};

export type DixtPluginRolesOptionsChannel = {
  id: string;
  name: string;
  description?: string;
  roles: DixtPluginRolesOptionsChannelRole[];
};

export type DixtPluginRolesOptions = {
  title?: string;
  channels?: DixtPluginRolesOptionsChannel[];
};

export const optionsDefaults = {
  channels: [],
};

const dixtPluginRoles: DixtPlugin<DixtPluginRolesOptions> = (
  instance,
  optionsValue,
) => {
  const options = merge({}, optionsDefaults, optionsValue);
  const controller = new RolesController(instance, options);

  instance.client.on(Events.ClientReady, async () => {
    if (!options.channels) {
      Log.error(`${name} - channels.main is required`);
      throw new Error(`${name} - channels.main is required`);
    }

    options.channels.forEach((c: DixtPluginRolesOptionsChannel) => {
      const channel = getTextChannel(instance.client, c.id);
      controller.initialize(channel, c);
    });
  });

  instance.client.on(
    Events.InteractionCreate,
    async (interaction: Interaction<CacheType>) => {
      if (!interaction.isButton()) return;
      if (!interaction.customId.startsWith("roles_")) return;
      if (!interaction.guild) return;
      if (!interaction.member || !interaction.member.user) return;

      if (interaction.customId.startsWith("roles_request")) {
        await interaction.deferReply({
          ephemeral: true,
        });

        const embed = await controller.handleRequest(interaction);
        await interaction.editReply({
          embeds: [embed],
        });

        (interaction.member.user as User)
          .send({
            embeds: [embed],
          })
          .catch((e) => Log.error(interaction.member?.user, e));
      }
    },
  );

  return {
    name,
  };
};

export default dixtPluginRoles;
