import dixt from "dixt";
import dixtPluginLogs from "dixt-plugin-logs";
import dixtPluginJoin from "dixt-plugin-join";
import dixtPluginPresence from "dixt-plugin-presence";
import dixtPluginReact from "dixt-plugin-react";
import dixtPluginTwitch from "dixt-plugin-twitch";
import dixtPluginWorktime from "dixt-plugin-worktime";
import dixtPluginJoinOptions from "./options/join";
import dixtPluginReactOptions from "./options/react";
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
      [dixtPluginJoin, dixtPluginJoinOptions],
      [dixtPluginReact, dixtPluginReactOptions],
      dixtPluginPresence,
      [dixtPluginTwitch, dixtPluginTwitchOptions],
      [dixtPluginWorktime, dixtPluginWorktimeOptions],
    ],
  });

  await instance.start();
};

main();
