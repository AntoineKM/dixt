import dixt from "dixt";
import schedule from "node-schedule";

import WorktimeController from "../controllers/worktime";
import Worktime from "../models/Worktime";

const worktimeReminderTask = (
  instance: dixt,
  controller: WorktimeController
) => {
  schedule.scheduleJob(controller.options.tasks?.end || "", async () => {
    const members = await controller.getMembersInWorkVoiceChannel();
    const membersId = members.map((member) => member.user.id);
    const worktimes = await Worktime.find({
      endAt: null,
    });
    await Promise.all(
      worktimes.map(async (worktime) => {
        if (!membersId.includes(worktime.userId)) {
          const user = await instance.client.users.fetch(worktime.userId);
          if (!user) return;
          await controller.end(user);
        }
      })
    );
  });
};

export default worktimeReminderTask;
