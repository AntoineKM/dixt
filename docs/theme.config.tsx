/* eslint-disable react-hooks/rules-of-hooks */
import { useRouter } from "next/router";
import { DocsThemeConfig } from "nextra-theme-docs";

const config: DocsThemeConfig = {
  project: {
    link: "https://github.com/AntoineKM/dixt",
  },
  docsRepositoryBase: "https://github.com/AntoineKM/dixt/blob/master/docs",
  useNextSeoProps() {
    const { route } = useRouter();
    if (route !== "/") {
      return {
        titleTemplate: `%s${"%s".includes("dixt") ? "" : " - dixt"}`,
      };
    }
  },
  logo: <span className={"logo"}>{"dixt."}</span>,
  nextThemes: {
    defaultTheme: "dark",
  },
  chat: {
    link: "https://discord.gg/n7vQFX2Vnn",
  },
  editLink: {
    text: "Edit this page on GitHub",
  },
  footer: {
    text: (
      <span>
        {"MIT "}
        {new Date().getFullYear()}
        {" © Antoine Kingue"}
      </span>
    ),
  },
};

export default config;
