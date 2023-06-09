import dixt from "dixt";
import dixtPluginAffix from "dixt-plugin-affix";
import dixtPluginJoin from "dixt-plugin-join";
import dixtPluginLogs from "dixt-plugin-logs";
import dixtPluginPresence from "dixt-plugin-presence";
import dixtPluginReact from "dixt-plugin-react";
import dixtPluginReports from "dixt-plugin-reports";
import dixtPluginRoles from "dixt-plugin-roles";
import dixtPluginTwitch from "dixt-plugin-twitch";
import dixtPluginWorktime from "dixt-plugin-worktime";

import dixtPluginAffixOptions from "./options/affix";
import dixtPluginJoinOptions from "./options/join";
import dixtPluginReactOptions from "./options/react";
import dixtPluginReportsOptions from "./options/reports";
import dixtPluginRolesOptions from "./options/roles";
import dixtPluginTwitchOptions from "./options/twitch";
import dixtPluginWorktimeOptions from "./options/worktime";

const main = async () => {
  const instance = new dixt({
    application: {
      name: "dixt",
      logo: "https://cdn.discordapp.com/avatars/785435385470779393/8dcbd78a1eae24d2e8874e9569acb3a5.webp",
    },
    plugins: [
      dixtPluginLogs,
      dixtPluginPresence,
      [dixtPluginAffix, dixtPluginAffixOptions],
      [dixtPluginJoin, dixtPluginJoinOptions],
      [dixtPluginReact, dixtPluginReactOptions],
      [dixtPluginReports, dixtPluginReportsOptions],
      [dixtPluginTwitch, dixtPluginTwitchOptions],
      [dixtPluginWorktime, dixtPluginWorktimeOptions],
      [dixtPluginRoles, dixtPluginRolesOptions],
    ],
  });

  await instance.start();
};

main();
