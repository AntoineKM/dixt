import dnext from "dnext";
import dnextPluginLogs from "dnext-plugin-logs";

const client = new dnext({
  plugins: [[dnextPluginLogs, {}]],
});

client.start();
