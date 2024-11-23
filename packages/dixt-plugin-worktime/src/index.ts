import {
  Events,
  User,
  VoiceState,
} from "discord.js";
import dixt, { DixtPlugin, Log } from "dixt";
import dotenv from "dotenv-flow";

import WorktimeController from "./controllers/worktime";
import worktimeAbsenteesTask from "./tasks/absentees";
import worktimeEndTask from "./tasks/end";
import worktimeLeaderboardTask from "./tasks/leaderboard";
import { name } from "../package.json";

dotenv.config({
  silent: true,
});

export type DixtPluginWorktimeOptions = {
  title?: string;
  channels?: {
    leaderboard?: string;
    workChannelNames?: string[];
  };
  quotas?: {
    [roleId: string]: number;
  };
  tasks?: {
    absentees?: string;
    end?: string;
    leaderboard?: string;
  };
  reports?: {
    minimumTime?: number;
    maximumDaysAbsent?: number;
  };
  messages?: {
    start?: {
      success?: string;
    };
    end?: {
      success?: string;
      progress?: string;
      noQuota?: string;
    };
    leaderboard?: {
      title?: string;
      description?: string;
    };
  };
};

export const optionsDefaults: DixtPluginWorktimeOptions = {
  title: "Worktime",
  channels: {
    leaderboard: process.env.DIXT_PLUGIN_WORKTIME_LEADERBOARD_CHANNEL_ID || "",
    workChannelNames:
      process.env.DIXT_PLUGIN_WORKTIME_WORKTIME_CHANNEL_NAMES?.split(",") || [],
  },
  tasks: {
    absentees:
      process.env.DIXT_PLUGIN_WORKTIME_ABSENTEES_TASK || "0 12 * * 2-7",
    end: process.env.DIXT_PLUGIN_WORKTIME_END_TASK || "*/10 * * * *",
    leaderboard:
      process.env.DIXT_PLUGIN_WORKTIME_LEADERBOARD_TASK || "0 12 * * 0",
  },
  reports: {
    minimumTime: 30,
    maximumDaysAbsent: 2,
  },
  messages: {
    start: {
      success: "Your worktime has started at %time%.",
    },
    end: {
      success:
        "Your worktime has ended at %time%. \n\n**Time worked this week:** %total_time%.%progress%",
      progress: "\n**Progression:** %progress%",
      noQuota: "You don't have a quota.",
    },
    leaderboard: {
      title: "Leaderboard",
    },
  },
};

const dixtPluginWorktime: DixtPlugin<DixtPluginWorktimeOptions> = (
  instance,
  optionsValue,
) => {
  const options = { ...optionsDefaults, ...optionsValue };
  const controller = new WorktimeController(instance, options);

  instance.client.on(Events.VoiceStateUpdate, async (oldState: VoiceState, newState: VoiceState) => {
    // Handle member joining a work channel
    if (isJoiningWorkChannel(oldState, newState, options.channels?.workChannelNames || [])) {
      try {
        const embed = await controller.start(newState.member?.user as User);
        newState.member?.user.send({ embeds: [embed] }).catch(e => Log.error(newState.member?.user, e));
      } catch (e) {
        Log.error(`Failed to start worktime for ${newState.member?.user}: ${e}`);
      }
    }
    
    // Handle member leaving a work channel
    if (isLeavingWorkChannel(oldState, newState, options.channels?.workChannelNames || [])) {
      try {
        const embed = await controller.end(oldState.member?.user as User);
        oldState.member?.user.send({ embeds: [embed] }).catch(e => Log.error(oldState.member?.user, e));
      } catch (e) {
        Log.error(`Failed to end worktime for ${oldState.member?.user}: ${e}`);
      }
    }

    // Handle deafened state
    if (oldState.deaf !== newState.deaf && newState.deaf) {
      dixt.events.emit("report", {
        message: `${newState.member} has been deafened.`,
      });
    }
  });

  // tasks
  worktimeAbsenteesTask(instance, controller);
  worktimeEndTask(instance, controller);
  worktimeLeaderboardTask(instance, controller);

  return {
    name,
  };
};

function isJoiningWorkChannel(oldState: VoiceState, newState: VoiceState, workChannelNames: string[]): boolean {
  // Check if user wasn't in a work channel before and is now joining one
  const wasInWorkChannel = oldState.channel !== null && workChannelNames.some(name => 
    oldState.channel?.name.toLowerCase().includes(name.toLowerCase())
  ) || false;
  
  const isJoiningWorkChannel = newState.channel !== null && workChannelNames.some(name => 
    newState.channel?.name.toLowerCase().includes(name.toLowerCase())
  ) || false;
  
  return !wasInWorkChannel && isJoiningWorkChannel;
}

function isLeavingWorkChannel(oldState: VoiceState, newState: VoiceState, workChannelNames: string[]): boolean {
  // Check if user was in a work channel and is now leaving it
  const wasInWorkChannel = oldState.channel !== null && workChannelNames.some(name => 
    oldState.channel?.name.toLowerCase().includes(name.toLowerCase())
  ) || false;
  
  const isJoiningWorkChannel = newState.channel !== null && workChannelNames.some(name => 
    newState.channel?.name.toLowerCase().includes(name.toLowerCase())
  ) || false;
  
  return wasInWorkChannel && !isJoiningWorkChannel;
}

export { default as WorktimeController } from "./controllers/worktime";
export default dixtPluginWorktime;