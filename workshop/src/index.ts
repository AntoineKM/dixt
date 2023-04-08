import dixt from "dixt";
import dixtPluginLogs from "dixt-plugin-logs";

(async () => {
  const instance = new dixt({
    plugins: [dixtPluginLogs],
  });

  await instance.start();
})();
