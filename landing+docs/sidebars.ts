import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: "doc",
      id: "intro",
      label: "Getting Started",
    },
    {
      type: "doc",
      id: "features",
      label: "Features",
    },
    {
      type: "doc",
      id: "architecture",
      label: "How It Works",
    },
    {
      type: "doc",
      id: "installation",
      label: "Installation",
    },
    {
      type: "doc",
      id: "configuration",
      label: "Configuration",
    },
    {
      type: "doc",
      id: "alternatives",
      label: "Alternatives",
    },
  ],
};

export default sidebars;
