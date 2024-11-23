import { DixtPluginWorktimeOptions } from "dixt-plugin-worktime";

import { CHANNELS, ROLES } from "../constants";

const dixtPluginWorktimeOptions: DixtPluginWorktimeOptions = {
  channels: {
    leaderboard: CHANNELS.DIXT_PLUGIN_WORKTIME.LEADERBOARD,
    workChannelNames: ["work"],
  },
  quotas: {
    [ROLES.MAINTAINER]: 2,
    [ROLES.CONTRIBUTOR]: 1,
  },
};

export default dixtPluginWorktimeOptions;
