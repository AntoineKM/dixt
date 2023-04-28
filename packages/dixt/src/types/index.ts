import {
  AutocompleteInteraction,
  CacheType,
  ChatInputCommandInteraction,
  Client,
  Collection,
  SlashCommandBuilder,
} from "discord.js";

export type DixtClient = Client<boolean> & {
  commands?: Collection<string, SlashCommandBuilder>;
};

export type DixtSlashCommandBuilder = SlashCommandBuilder & {
  data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (_interaction: ChatInputCommandInteraction<CacheType>) => void;
  autocomplete: (_interaction: AutocompleteInteraction<CacheType>) => void;
};
