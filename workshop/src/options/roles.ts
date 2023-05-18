import { DixtPluginRolesOptions } from "dixt-plugin-roles";

import { CHANNELS, ROLES } from "../constants";

const dixtPluginTwitchOptions: DixtPluginRolesOptions = {
  channels: [
    {
      id: CHANNELS.DIXT_PLUGIN_ROLES.ROLES,
      name: "Assign yourself a role!",
      roles: [
        {
          id: ROLES.TESTER,
          emoji: "🧪",
          description: "For testers",
        },
      ],
    },
  ],
};

export default dixtPluginTwitchOptions;
