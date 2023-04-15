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
  Role,
  User,
} from "discord.js";
import dixt, { Log, formatDuration, progressIndicator } from "dixt";
import { DixtPluginWorktimeOptions } from "..";
import Worktime from "../models/Worktime";

class WorktimeController {
  public static baseEmbed = {
    title: "",
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

    WorktimeController.baseEmbed.title = this.options.title || "";
    WorktimeController.baseEmbed.footer.text =
      this.instance.application?.name || "";
    WorktimeController.baseEmbed.footer.icon_url =
      this.instance.application?.logo || "";
  }

  public async initialize(channel: Channel): Promise<void> {
    if (channel?.type !== ChannelType.GuildText) return;

    const instructionEmbed: APIEmbed = {
      ...WorktimeController.baseEmbed,
      description: this.options.messages?.main?.instructions || "",
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
                label: this.options.messages?.main?.startButton || "",
                custom_id: "worktime_start",
              },
              {
                type: 2,
                style: ButtonStyle.Danger,
                label: this.options.messages?.main?.endButton || "",
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
        description:
          this.options.messages?.start?.alreadyStarted?.replace(
            /%time%/g,
            `<t:${Math.floor(currentWorktime.startAt.getTime() / 1000)}:t>`
          ) || "",
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
        description:
          this.options.messages?.start?.success?.replace(
            /%time%/g,
            `<t:${Math.floor(Date.now() / 1000)}:t>`
          ) || "",
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
        description: this.options.messages?.end?.notStarted || "",
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

      const higherRoleWithQuota = await this.getHigherRoleWithQuota(user);
      const totalWorktimeInHours = totalWorktime / 1000 / 60 / 60;
      const percentage =
        higherRoleWithQuota && this.options.quotas
          ? (totalWorktimeInHours /
              this.options.quotas[higherRoleWithQuota.id]) *
            100
          : 0;

      embed = {
        ...WorktimeController.baseEmbed,
        color: Colors.Green,
        description: this.options.messages?.end?.success
          ?.replace(/%time%/g, `<t:${Math.floor(Date.now() / 1000)}:t>`)
          .replace(/%total_time%/g, formatDuration(totalWorktime))
          .replace(
            /%progress%/g,
            `${
              higherRoleWithQuota !== undefined
                ? higherRoleWithQuota !== null
                  ? this.options.messages?.end?.progress?.replace(
                      /%progress%/g,
                      progressIndicator(percentage)
                    )
                  : this.options.messages?.end?.noQuota || ""
                : ""
            }`
          ),
      };

      user
        .send({
          embeds: [embed],
        })
        .catch((e) => Log.error(user, e));

      Log.info(
        `${user} validated his end of service at <t:${Math.floor(
          Date.now() / 1000
        )}:t> - ${formatDuration(totalWorktime)} - ${
          higherRoleWithQuota !== undefined
            ? higherRoleWithQuota !== null
              ? progressIndicator(percentage)
              : "no quota"
            : ""
        }`
      );
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

  // undefined = no quota in options
  // null = no role with quota
  // Role = role with quota
  public async getHigherRoleWithQuota(
    user: User
  ): Promise<Role | null | undefined> {
    const { client } = user;
    await client.guilds.fetch();
    const guilds = client.guilds.cache;
    let result: Role | null | undefined = undefined;
    if (!this.options.quotas) return result;
    await Promise.all(
      guilds.map(async (guild) => {
        const member = await guild.members.fetch(user.id);
        if (!member) return;
        const roles = member.roles.cache;
        await user.client.guilds.fetch();
        const rolesWithQuota = roles.filter((r) => {
          if (!r) return false;
          if (!this.options.quotas) return false;
          if (this.options.quotas[r.id]) return true;
          return false;
        });
        if (!rolesWithQuota || rolesWithQuota.size === 0) {
          result = null;
          return;
        }
        const sortedRoles = rolesWithQuota.sort((a, b) => {
          if (!a || !b) return 0;
          return b.position - a.position;
        });
        if (!sortedRoles) return;
        const higherRole = sortedRoles.first();
        if (!higherRole) return;
        if (!result) {
          result = higherRole;
          return;
        } else {
          result = null;
        }
      })
    );
    return result;
  }
}

export default WorktimeController;
