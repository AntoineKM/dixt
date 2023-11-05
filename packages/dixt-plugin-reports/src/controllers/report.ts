import { Colors } from "discord.js";
import dixt, { getTextChannel } from "dixt";

import { DixtPluginReportsOptions } from "..";

class ReportController {
  public static baseEmbed = {
    title: "",
    color: Colors.Yellow,
    footer: {
      text: "",
      icon_url: "",
    },
  };

  constructor(
    public instance: dixt,
    public options: DixtPluginReportsOptions,
  ) {
    this.instance = instance;
    this.options = options;

    ReportController.baseEmbed.title = this.options.title || "";
    ReportController.baseEmbed.footer.text =
      this.instance.application?.name || "";
    ReportController.baseEmbed.footer.icon_url =
      this.instance.application?.logo || "";
  }

  public send = (message: string) => {
    const channel = getTextChannel(
      this.instance.client,
      this.options.channel || "",
    );

    channel.send({
      embeds: [
        {
          ...ReportController.baseEmbed,
          description: message,
        },
      ],
    });

    return channel;
  };
}

export default ReportController;
