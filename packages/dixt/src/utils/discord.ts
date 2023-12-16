import { ChannelType, Client, GuildMember, TextChannel } from "discord.js";

export const getTextChannel = (client: Client, channelId: string) => {
  client.channels.fetch(channelId);
  const channel = client.channels.cache.get(channelId) as TextChannel;
  if (!channel) {
    throw new Error("Channel not found");
  }
  if (channel.type !== ChannelType.GuildText) {
    throw new Error("Channel is not a text channel");
  }
  return channel;
};

export const getMembersWithRole = async (
  client: Client,
  roleId: string,
): Promise<GuildMember[]> => {
  await client.guilds.fetch();
  const guilds = client.guilds.cache;

  const guild = guilds.find((guild) => guild.roles.cache.has(roleId));

  if (!guild) {
    throw new Error("Guild not found");
  }

  const role = guild.roles.cache.get(roleId);

  if (!role) {
    throw new Error("Role not found");
  }

  const members = Array.from(role.members.values());

  return members;
};
