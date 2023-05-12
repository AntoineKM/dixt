import { DixtPluginWorktimeOptions } from "dixt-plugin-worktime";

import { CHANNELS, ROLES } from "../constants";

const dixtPluginWorktimeOptions: DixtPluginWorktimeOptions = {
  channels: {
    leaderboard: CHANNELS.DIXT_PLUGIN_WORKTIME.LEADERBOARD,
    main: [CHANNELS.DIXT_PLUGIN_WORKTIME.MAIN, "1106660583366991973"],
    workChannelNames: ["work"],
  },
  quotas: {
    [ROLES.MAINTAINER]: 2,
    [ROLES.CONTRIBUTOR]: 1,
  },
};

export default dixtPluginWorktimeOptions;
