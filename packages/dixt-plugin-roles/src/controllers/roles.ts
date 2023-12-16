import {
  APIEmbed,
  ButtonInteraction,
  ButtonStyle,
  CacheType,
  Channel,
  ChannelType,
  Colors,
  GuildMemberRoleManager,
} from "discord.js";
import dixt from "dixt";

import { DixtPluginRolesOptions, DixtPluginRolesOptionsChannel } from "..";

class RolesController {
  public static baseEmbed = {
    title: "",
    color: Colors.White,
    footer: {
      text: "",
      icon_url: "",
    },
  };

  constructor(public instance: dixt, public options: DixtPluginRolesOptions) {
    this.instance = instance;
    this.options = options;

    RolesController.baseEmbed.title = this.options.title || "";
    RolesController.baseEmbed.footer.text =
      this.instance.application?.name || "";
    RolesController.baseEmbed.footer.icon_url =
      this.instance.application?.logo || "";
  }

  public async initialize(
    channel: Channel,
    options: DixtPluginRolesOptionsChannel
  ): Promise<void> {
    if (channel?.type !== ChannelType.GuildText) return;

    const instructionEmbed: APIEmbed = {
      ...RolesController.baseEmbed,
      title: options.name,
      description: `${
        options.description ? `${options.description}\n\n` : ""
      }${options.roles
        .map(
          (r) =>
            `- ${r.emoji} - <@&${r.id}>${
              r.description ? ` - ${r.description}` : ""
            }`
        )
        .join("\n")}`,
    };

    const messages = await channel.messages.fetch();

    const messagesWithSameContent = messages.filter(
      (message) =>
        message.embeds[0]?.description === instructionEmbed.description &&
        message.embeds[0]?.title === instructionEmbed.title &&
        message.embeds[0]?.color === instructionEmbed.color &&
        message.embeds[0]?.footer?.text === instructionEmbed.footer?.text &&
        message.embeds[0]?.footer?.iconURL === instructionEmbed.footer?.icon_url
    );

    if (messagesWithSameContent.size === 0) {
      await Promise.all(
        messages.map(async (message) => await message.delete())
      );

      // TODO: Replace these types by discord.js types
      const actionRows: {
        type: number;
        components: {
          type: number;
          style: ButtonStyle;
          label: string;
          custom_id: string;
        }[];
      }[] = [];
      let currentRow: {
        type: number;
        components: {
          type: number;
          style: ButtonStyle;
          label: string;
          custom_id: string;
        }[];
      } = {
        type: 1,
        components: [],
      };

      for (const role of options.roles) {
        if (currentRow.components.length === 5) {
          actionRows.push(currentRow);
          currentRow = { type: 1, components: [] };
        }

        currentRow.components.push({
          type: 2,
          style: ButtonStyle.Primary,
          label: role.emoji,
          custom_id: `roles_request:${role.id}`,
        });
      }

      if (currentRow.components.length > 0) {
        actionRows.push(currentRow);
      }

      await channel.send({
        embeds: [instructionEmbed],
        components: actionRows,
      });
    }
  }

  public async handleRequest(
    interaction: ButtonInteraction<CacheType>
  ): Promise<APIEmbed> {
    let embed: APIEmbed = {
      ...RolesController.baseEmbed,
    };

    const roleId = interaction.customId.split(":")[1];
    const role = interaction.guild?.roles.cache.get(roleId);

    // check if the role is in the options
    const isInRoleOption = this.options.channels?.some((channel) =>
      channel.roles.some((r) => r.id === roleId)
    );

    const memberRoles = interaction.member?.roles as GuildMemberRoleManager;

    if (!role || !isInRoleOption) {
      embed = {
        ...RolesController.baseEmbed,
        color: Colors.Red,
        description: "This role does not exist.",
      };
    } else if (memberRoles.cache.has(roleId)) {
      await memberRoles.remove(roleId);

      embed = {
        ...RolesController.baseEmbed,
        color: Colors.Green,
        description: `You have been removed from ${role}.`,
      };
    } else {
      await memberRoles.add(roleId);

      const message = this.options.channels
        ?.find((channel) =>
          channel.roles.find((r) => r.id === roleId && r.message)
        )
        ?.roles.find((r) => r.id === roleId)?.message;

      embed = {
        ...RolesController.baseEmbed,
        color: Colors.Green,
        description: `You have been added to ${role}.${
          message ? `\n\n${message}` : ""
        }`,
      };
    }

    return embed;
  }
}

export default RolesController;
