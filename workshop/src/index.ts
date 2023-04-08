import dixt from "dixt";
import dixtPluginLogs from "dixt-plugin-logs";
import dixtPluginJoin from "dixt-plugin-join";

const main = async () => {
  const instance = new dixt({
    plugins: [
      dixtPluginLogs,
      [
        dixtPluginJoin,
        {
          channelId: "1094214474292002816",
        },
      ],
    ],
  });

  await instance.start();
};

main();
