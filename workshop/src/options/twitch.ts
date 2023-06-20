import { DixtPluginTwitchOptions } from "dixt-plugin-twitch";

import { CHANNELS, ROLES } from "../constants";

const dixtPluginTwitchOptions: DixtPluginTwitchOptions = {
  channel: CHANNELS.DIXT_PLUGIN_TWITCH.STREAMS,
  roles: [ROLES.MAINTAINER, ROLES.CONTRIBUTOR],
};

export default dixtPluginTwitchOptions;
