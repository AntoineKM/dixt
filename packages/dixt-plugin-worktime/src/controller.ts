import {
  APIEmbed,
  ButtonStyle,
  Channel,
  ChannelType,
  Collection,
  Colors,
  GuildChannel,
  GuildMember,
  NonThreadGuildBasedChannel,
  User,
} from "discord.js";
import dixt, { Log } from "dixt";
import { DixtPluginWorktimeOptions } from ".";
import Worktime from "./models/Worktime";

class WorktimeController {
  public static baseEmbed = {
    title: "Pointeuse",
    color: Colors.White,
    footer: {
      text: "",
      icon_url: "",
    },
  };

  constructor(
    public instance: dixt,
    public options: DixtPluginWorktimeOptions
  ) {
    this.instance = instance;
    this.options = options;

    WorktimeController.baseEmbed.footer.text =
      this.instance.application?.name || "";
    WorktimeController.baseEmbed.footer.icon_url =
      this.instance.application?.logo || "";
  }

  public async initialize(channel: Channel): Promise<void> {
    if (channel?.type !== ChannelType.GuildText) return;

    const instructionEmbed: APIEmbed = {
      ...WorktimeController.baseEmbed,
      description:
        "Pointage des heures des membres de l'équipe.\n\n" +
        "**Prise de service**\n" +
        "Appuyez sur le bouton **Prise de service** pour pointer votre arrivée.\n\n" +
        "**Fin de service**\n" +
        "Appuyez sur le bouton **Fin de service** pour pointer votre départ.\n\n" +
        "**Attention**\n" +
        "Veillez à bien vous connecter à un salon vocal **Fréquence** pour que votre prise de service soit bien prise en compte.",
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

      await channel.send({
        embeds: [instructionEmbed],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: ButtonStyle.Primary,
                label: "✨ Prise de service",
                custom_id: "worktime_start",
              },
              {
                type: 2,
                style: ButtonStyle.Danger,
                label: "🚪 Fin de service",
                custom_id: "worktime_end",
              },
            ],
          },
        ],
      });
    }
  }

  public async start(user: User): Promise<APIEmbed> {
    const currentWorktime = await Worktime.findOne({
      userId: user.id,
      endAt: null,
    });

    let embed: APIEmbed = {
      ...WorktimeController.baseEmbed,
    };

    if (currentWorktime) {
      embed = {
        ...WorktimeController.baseEmbed,
        color: Colors.Red,
        description: `Vous avez déjà commencé votre service <t:${Math.floor(
          currentWorktime.startAt.getTime() / 1000
        )}:R>`,
      };

      user
        .send({
          embeds: [embed],
        })
        .catch((e) => Log.error(user, e));

      Log.info(
        `${user} tried to start his service twice at <t:${Math.floor(
          Date.now() / 1000
        )}:t> but he already started his service at <t:${Math.floor(
          currentWorktime.startAt.getTime() / 1000
        )}:t>`
      );
    } else {
      await Worktime.create({
        startAt: new Date(),
        userId: user.id,
      });

      embed = {
        ...WorktimeController.baseEmbed,
        color: Colors.Green,
        description: `Votre prise de service a été validée à <t:${Math.floor(
          Date.now() / 1000
        )}:t>`,
      };

      user
        .send({
          embeds: [embed],
        })
        .catch((e) => Log.error(user, e));

      Log.info(
        `${user} validated his service at <t:${Math.floor(
          Date.now() / 1000
        )}:t>`
      );
    }

    return embed;
  }

  public async end(user: User): Promise<APIEmbed> {
    const currentWorktime = await Worktime.findOne({
      userId: user.id,
      endAt: null,
    });

    let embed: APIEmbed = {
      ...WorktimeController.baseEmbed,
    };

    if (!currentWorktime) {
      embed = {
        ...WorktimeController.baseEmbed,
        color: Colors.Red,
        description: "Vous n'avez pas commencé votre service aujourd'hui",
      };
      user
        .send({
          embeds: [embed],
        })
        .catch((e) => Log.error(user, e));
      Log.info(
        `${user} tried to end his service at <t:${Math.floor(
          Date.now() / 1000
        )}:t> but he didn't start his service`
      );
    } else {
      currentWorktime.endAt = new Date();
      await currentWorktime.save();

      const worktimes = await Worktime.find({
        userId: user.id,
      });

      let totalWorktime = 0;
      worktimes.forEach((worktime) => {
        if (worktime.startAt && worktime.endAt) {
          totalWorktime +=
            worktime.endAt.getTime() - worktime.startAt.getTime();
        }
      });

      const totalWorktimeInHours = totalWorktime / 1000 / 60 / 60;
    }

    return embed;
  }

  public async isInWorkChannel(member: GuildMember): Promise<boolean> {
    const { guild } = member;
    const channels = await guild.channels.fetch();
    if (!channels) return false;
    const workChannels = channels.filter((c) => {
      if (!c) return false;
      if (
        c.type !== ChannelType.GuildVoice &&
        c.type !== ChannelType.GuildStageVoice
      )
        return false;
      if (
        this.options.channels?.workChannelNames &&
        this.options.channels.workChannelNames
          .map((n) => c.name.includes(n))
          .includes(true)
      ) {
        return true;
      }
      return false;
    }) as Collection<string, GuildChannel>;

    if (!workChannels) return false;

    const results = await Promise.all(
      workChannels.map(async (channel) => {
        if (!channel) return false;
        const members = channel.members as Collection<string, GuildMember>;
        const m = members.get(member.id);
        if (m) return true;
        return false;
      })
    );
    return results.includes(true);
  }

  public async getWorkChannels() {
    const channels: NonThreadGuildBasedChannel[] = [];

    await Promise.all(
      this.instance.client.guilds.cache.map(async (guild) => {
        const guildChannels = await guild.channels.fetch();
        if (!guildChannels) return;
        const workChannels = Array.from(
          guildChannels
            .filter((c): c is NonThreadGuildBasedChannel => {
              if (!c) return false;
              if (
                c.type !== ChannelType.GuildVoice &&
                c.type !== ChannelType.GuildStageVoice
              )
                return false;
              if (
                this.options.channels?.workChannelNames &&
                this.options.channels.workChannelNames
                  .map((n) => c.name.includes(n))
                  .includes(true)
              ) {
                return true;
              }
              return false;
            })
            .values()
        ).filter((c): c is NonThreadGuildBasedChannel => c !== null);
        channels.push(...workChannels);
      })
    );

    return channels;
  }
}

export default WorktimeController;
