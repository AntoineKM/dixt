import { Colors } from "discord.js";
import dixt, { Log } from "dixt";
import schedule from "node-schedule";

import WorktimeController from "../controllers/worktime";
import Worktime from "../models/Worktime";

const worktimeReminderTask = (_: dixt, controller: WorktimeController) => {
  schedule.scheduleJob(controller.options.tasks?.reminder || "", async () => {
    const members = await controller.getMembersInWorkVoiceChannel();

    await Promise.all(
      members.map(async (member) => {
        await member.fetch();
        const higherRole = await controller.getHigherRoleWithQuota(member.user);
        if (higherRole) {
          const worktime = await Worktime.findOne({
            userId: member.user.id,
            endAt: null,
          });
          if (!worktime) {
            Log.info(
              `**${member.guild}** - ${member.user} seems to have forgotten to start worktime, sending a reminder...`
            );
            try {
              member
                .send({
                  embeds: [
                    {
                      ...WorktimeController.baseEmbed,
                      color: Colors.Red,
                      description: `Vous semblez avoir oublié de pointer votre arrivée aujourd'hui (<#${controller.options.channels?.main}>)`,
                    },
                  ],
                })
                .catch((e) => Log.error(member, e));
            } catch (e) {
              Log.error(e);
            }
          }
        }
      })
    );
  });
};

export default worktimeReminderTask;
