import { ChartOptions, ChartData, ChartConfiguration } from "chart.js";
import dayjs from "dayjs";
import {
  APIEmbed,
  ChannelType,
  Collection,
  Colors,
  GuildMember,
  NonThreadGuildBasedChannel,
  Role,
  User,
} from "discord.js";
import dixt, {
  capitalize,
  Log,
  formatDuration,
  progressIndicator,
  pad,
} from "dixt";
import QuickChart from "quickchart-js";

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

  public static async getCurrentWorkersCount(): Promise<number> {
    const worktimes = await Worktime.find({ endAt: null });
    if (!worktimes) return 0;
    return worktimes.length;
  }

  constructor(
    public instance: dixt,
    public options: DixtPluginWorktimeOptions,
  ) {
    this.instance = instance;
    this.options = options;

    WorktimeController.baseEmbed.title = this.options.title || "";
    WorktimeController.baseEmbed.footer.text =
      this.instance.application?.name || "";
    WorktimeController.baseEmbed.footer.icon_url =
      this.instance.application?.logo || "";
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
          this.options.messages?.start?.success?.replace(
            /%time%/g,
            `<t:${Math.floor(currentWorktime.startAt.getTime() / 1000)}:t>`,
          ) || "",
      };

      Log.info(
        `${user} is already in a work channel since <t:${Math.floor(
          currentWorktime.startAt.getTime() / 1000,
        )}:t>`,
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
            `<t:${Math.floor(Date.now() / 1000)}:t>`,
          ) || "",
      };

      Log.info(
        `${user} joined a work channel at <t:${Math.floor(
          Date.now() / 1000,
        )}:t>`,
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
      // No need to notify the user if they weren't in a work session
      Log.info(
        `${user} left voice channel at <t:${Math.floor(
          Date.now() / 1000,
        )}:t> but had no active work session`,
      );
      return embed;
    }

    currentWorktime.endAt = new Date();
    await currentWorktime.save();

    const worktimes = await Worktime.find({
      userId: user.id,
    });

    let totalWorktime = 0;
    worktimes.forEach((worktime) => {
      if (worktime.startAt && worktime.endAt) {
        totalWorktime += worktime.endAt.getTime() - worktime.startAt.getTime();
      }
    });

    const higherRoleWithQuota = await this.getHigherRoleWithQuota(user);
    const totalWorktimeInHours = totalWorktime / 1000 / 60 / 60;
    const percentage =
      higherRoleWithQuota && this.options.quotas
        ? (totalWorktimeInHours / this.options.quotas[higherRoleWithQuota.id]) *
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
                    progressIndicator(percentage),
                  )
                : this.options.messages?.end?.noQuota || ""
              : ""
          }`,
        ),
    };

    Log.info(
      `${user} left work channel at <t:${Math.floor(
        Date.now() / 1000,
      )}:t> - ${formatDuration(totalWorktime)} - ${
        higherRoleWithQuota !== undefined
          ? higherRoleWithQuota !== null
            ? progressIndicator(percentage)
            : "no quota"
          : ""
      }`,
    );

    if (
      currentWorktime.endAt.getTime() - currentWorktime.startAt.getTime() <
      (this.options.reports?.minimumTime || 30) * 60 * 1000
    ) {
      dixt.events.emit("report", {
        message: `${user} work session was less than 30 minutes.`,
      });
    }

    return embed;
  }

  public async isInWorkChannel(member: GuildMember): Promise<boolean> {
    const workChannels = await this.getWorkChannels();
    if (!workChannels) return false;

    const results = await Promise.all(
      workChannels.map(async (channel) => {
        if (!channel) return false;
        const members = channel.members as Collection<string, GuildMember>;
        const m = members.get(member.id);
        if (m) return true;
        return false;
      }),
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
                  .map((n) => c.name.toLowerCase().includes(n.toLowerCase()))
                  .includes(true)
              ) {
                return true;
              }
              return false;
            })
            .values(),
        ).filter((c): c is NonThreadGuildBasedChannel => c !== null);
        channels.push(...workChannels);
      }),
    );

    return channels;
  }

  public async getMembersInWorkVoiceChannel(): Promise<GuildMember[]> {
    await this.instance.client.guilds.fetch();
    const guilds = this.instance.client.guilds.cache;
    const results: GuildMember[] = [];

    await Promise.all(
      guilds.map(async (guild) => {
        await guild.channels.fetch();
        const channels = guild.channels.cache;
        if (!channels) return;
        const workChannels = channels.filter(
          (channel) =>
            (channel.type === ChannelType.GuildVoice ||
              channel.type === ChannelType.GuildStageVoice) &&
            this.options.channels?.workChannelNames?.some((name) =>
              channel.name.toLowerCase().includes(name.toLowerCase()),
            ),
        );
        if (!workChannels) return;

        await Promise.all(
          workChannels.map(async (channel) => {
            const members = channel.members as Collection<string, GuildMember>;
            members.map((member) => {
              if (!results.includes(member)) results.push(member);
            });
          }),
        );
      }),
    );

    return results;
  }

  // undefined = no quota in options
  // null = no role with quota
  // Role = role with quota
  public async getHigherRoleWithQuota(
    user: User,
  ): Promise<Role | null | undefined> {
    const { client } = user;
    await client.guilds.fetch();
    const guilds = client.guilds.cache;
    let result: Role | null | undefined = undefined;

    if (!this.options.quotas) {
      return result;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_guildId, guild] of guilds) {
      if (result) {
        break;
      }

      const member = await guild.members.cache.get(user.id);

      if (!member) {
        continue;
      }

      const roles = member.roles.cache;
      const rolesWithQuota = roles.filter((r) => {
        if (!r) {
          return false;
        }
        if (!this.options.quotas) {
          return false;
        }
        return Boolean(this.options.quotas[r.id]);
      });

      if (rolesWithQuota.size === 0) {
        result = null;
        continue;
      }

      const sortedRoles = rolesWithQuota.sort((a, b) => {
        if (!a || !b) {
          return 0;
        }
        return b.position - a.position;
      });

      const higherRole = sortedRoles.first();

      if (!higherRole) {
        continue;
      }

      result = higherRole;
    }

    return result;
  }

  public async getUsersWithQuota(): Promise<User[]> {
    const { client } = this.instance;
    await client.guilds.fetch();
    const guilds = client.guilds.cache;
    const results: User[] = [];

    if (!this.options.quotas) {
      return results;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_guildId, guild] of guilds) {
      const members = await guild.members.fetch();
      const membersWithQuota = members.filter((m) => {
        if (!m) {
          return false;
        }
        const roles = m.roles.cache;
        const rolesWithQuota = roles.filter((r) => {
          if (!r) {
            return false;
          }
          if (!this.options.quotas) {
            return false;
          }
          return Boolean(this.options.quotas[r.id]);
        });
        return rolesWithQuota.size > 0;
      });
      membersWithQuota.map((m) => {
        if (!results.includes(m.user)) {
          results.push(m.user);
        }
      });
    }

    return results;
  }

  public async getLeaderboardEmbed(): Promise<APIEmbed> {
    const now = new Date();
    const nowTimestamp = now.getTime();

    // get all worktimes
    const worktimes = await Worktime.find();

    // set endAt to now if it's null
    const endWorktimes = worktimes.map((worktime) => {
      if (!worktime.endAt) {
        worktime.endAt = now;
      }
      return worktime;
    });

    let leaderboardEmbed: APIEmbed = {
      ...WorktimeController.baseEmbed,
      title: "Leaderboard",
    };

    if (endWorktimes && endWorktimes.length > 0) {
      const firstWorktime = endWorktimes.sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      )[0];
      const firstWorktimeTimestamp = new Date(firstWorktime.startAt).getTime();

      // create a map with the total worktime of each user
      const worktimeMap = new Map<string, number>();
      // don't use forEach because it's async and we need to wait for the result, so use map
      await Promise.all(
        endWorktimes.map(async (worktime) => {
          const totalWorktime = worktimeMap.get(worktime.userId) || 0;
          worktimeMap.set(
            worktime.userId,
            totalWorktime + dayjs(worktime.endAt).diff(dayjs(worktime.startAt)),
          );
        }),
      );

      // sort the map by total worktime
      const sortedWorktimeMap = new Map(
        [...worktimeMap.entries()].sort((a, b) => b[1] - a[1]),
      );

      // calculate additional statistics
      const statsWorktimesCount = worktimes.length;
      const statsWorktimesDuration = [...worktimeMap.values()].reduce(
        (a, b) => a + b,
        0,
      );

      // create a map of the number of users working at each hour
      const hourMap = new Map<string, number>();
      endWorktimes.forEach((worktime) => {
        const startHour = dayjs(worktime.startAt).hour();
        const endHour = worktime.endAt
          ? dayjs(worktime.endAt).hour()
          : dayjs().hour();

        for (let i = startHour; i < endHour; i++) {
          hourMap.set(i.toString(), (hourMap.get(i.toString()) || 0) + 1);
        }
      });

      // find the busiest and quietest hour
      const statsBusiestHour =
        hourMap.size > 0
          ? dayjs(
              `1970-01-01T${
                [...hourMap.entries()].sort((a, b) => b[1] - a[1])[0][0]
              }:00.000`,
            ).format("HH:mm")
          : "N/A";
      const statsQuietestHour =
        hourMap.size > 0
          ? dayjs(
              `1970-01-01T${
                [...hourMap.entries()].sort((a, b) => a[1] - b[1])[0][0]
              }:00.000`,
            ).format("HH:mm")
          : "N/A";

      // create a map of the number of users working on each day
      const dayMap = new Map<string, number>();
      endWorktimes.forEach((worktime) => {
        const day = dayjs(worktime.startAt).format("YYYY-MM-DD");
        dayMap.set(day, (dayMap.get(day) || 0) + 1);
      });

      // find the busiest and quietest day
      const statsBusiestDay = dayjs(
        [...dayMap.entries()].sort((a, b) => b[1] - a[1])[0][0],
      ).format("dddd");
      const statsQuietestDay = dayjs(
        [...dayMap.entries()].sort((a, b) => a[1] - b[1])[0][0],
      ).format("dddd");

      const totalHours =
        (nowTimestamp - firstWorktimeTimestamp) / (1000 * 60 * 60);
      const totalUsers = [...sortedWorktimeMap.keys()].length;
      const statsAverageUserCountPerHour = totalHours / totalUsers;

      const dayAndHourMap = new Map<string, number>();
      endWorktimes.forEach((worktime) => {
        for (
          let i =
            Math.floor(new Date(worktime.startAt).getTime() / (3600 * 1000)) *
            3600 *
            1000;
          i <= new Date(worktime.endAt as Date).getTime();
          i += 3600 * 1000
        ) {
          const dayAndHour = dayjs(i).format("DD/MM/YYYY HH");
          dayAndHourMap.set(
            dayAndHour,
            (dayAndHourMap.get(dayAndHour) || 0) + 1,
          );
        }
      });

      const chart = new QuickChart();
      const labels: string[] = [];
      for (
        let i =
          Math.floor(firstWorktimeTimestamp / (3600 * 1000)) * 3600 * 1000;
        i <= nowTimestamp;
        i += 3600 * 1000
      ) {
        labels.push(dayjs(i).format("DD/MM/YYYY HH"));
      }
      const chartData: ChartData = {
        // 7 days and 24 hours
        labels,
        datasets: [
          {
            label: "Employees per hour",
            data: labels.map((label) => {
              return dayAndHourMap.get(label) || 0;
            }),
            borderColor: "rgb(88, 101, 242)",
            tension: 0.8,
            fill: false,
            pointRadius: 0,
            backgroundColor: "rgba(88, 101, 242, 0.2)",
          },
          {
            label: "Average employees per hour",
            data: labels.map(() => statsAverageUserCountPerHour),
            borderColor: "rgb(235, 69, 158)",
            pointRadius: 0,
          },
        ],
      };
      const chartOptions: ChartOptions = {
        color: "white",
        borderColor: "white",
        // disable legend and enable title
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: "Employees per hour",
            color: "white",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: "white",
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
          },
          x: {
            ticks: {
              color: "white",
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
          },
        },
      };
      const chartConfig: ChartConfiguration = {
        type: "line",
        data: chartData,
        options: chartOptions,
      };
      chart.setConfig(chartConfig);
      chart.setBackgroundColor("rgb(47, 49, 54)");
      chart.setVersion("4");

      leaderboardEmbed = {
        ...leaderboardEmbed,
        description:
          `Here is the team leaderboard for the week from ${dayjs()
            .subtract(1, "week")
            .format("DD/MM/YYYY")} to ${dayjs().format("DD/MM/YYYY")}\n\n` +
          [...sortedWorktimeMap.entries()]
            .map(
              ([userId, totalWorktime], index) =>
                `\`${pad(index + 1, 2)}. ${formatDuration(
                  totalWorktime,
                )}\` - <@${userId}>`,
            )
            .join("\n") +
          "\n\n**Statistics**",
        fields: [
          {
            name: "Number of service entries",
            value: `${statsWorktimesCount}`,
            inline: true,
          },
          {
            name: "Total work time",
            inline: true,
            value: `${pad(
              Math.floor(statsWorktimesDuration / 1000 / 60 / 60),
              2,
            )}h${pad(
              Math.floor((statsWorktimesDuration / 1000 / 60) % 60),
              2,
            )}`,
          },
          {
            name: "Average employees per hour",
            inline: true,
            value: `${statsAverageUserCountPerHour.toFixed(2)}`,
          },
          {
            name: "Peak hour",
            value: statsBusiestHour,
            inline: true,
          },
          {
            name: "Quietest hour",
            value: statsQuietestHour,
            inline: true,
          },
          {
            name: "Peak day",
            value: capitalize(statsBusiestDay),
            inline: true,
          },
          {
            name: "Quietest day",
            value: capitalize(statsQuietestDay),
            inline: true,
          },
        ],
        image: {
          url: await chart.getShortUrl(),
        },
      };
    } else {
      leaderboardEmbed = {
        ...leaderboardEmbed,
        description: "There is not enough data to display the leaderboard.",
      };
    }

    return leaderboardEmbed;
  }

  public async getAbsentees(days = 2): Promise<User[]> {
    const users = await this.getUsersWithQuota();

    const absentees = await Promise.all(
      users.map(async (user) => {
        const lastWorktime = await Worktime.findOne({
          userId: user.id,
        }).sort({ startAt: -1 });

        if (!lastWorktime) {
          return user;
        }

        const lastWorktimeTimestamp = new Date(lastWorktime.startAt).getTime();
        const nowTimestamp = new Date().getTime();

        const daysSinceLastWorktime =
          (nowTimestamp - lastWorktimeTimestamp) / (1000 * 60 * 60 * 24);

        if (daysSinceLastWorktime > days) {
          return user;
        }

        return null;
      }),
    );

    const result = absentees.filter((absentee) => absentee !== null) as User[];
    return result;
  }
}

export default WorktimeController;
