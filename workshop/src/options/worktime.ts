import { DixtPluginWorktimeOptions } from "dixt-plugin-worktime";
import { CHANNELS } from "../constants";

const dixtPluginWorktimeOptions: DixtPluginWorktimeOptions = {
  channels: {
    timeClock: [CHANNELS.DIXT_PLUGIN_WORKTIME.TIME_CLOCK],
    workChannelNames: ["work"],
  },
};

export default dixtPluginWorktimeOptions;
