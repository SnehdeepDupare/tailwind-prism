import { Icons } from "@/components/icons";
import { siteConfig } from "./site";

export const FEATURES = [
  {
    title: "Semantic Highlighting",
    description:
      "Highlights Tailwind utilities based on what they mean, variants, modifiers, arbitrary values, not just raw strings.",
  },
  {
    title: "Better Readability",
    description:
      "Long Tailwind class lists become scannable, reducing cognitive load when reading or editing UI code.",
  },
  {
    title: "Full File or Cursor Mode",
    description:
      "Choose between highlighting all Tailwind classes in a file or only the active class block under your cursor.",
  },
  {
    title: "Toggleable, On Your Terms",
    description:
      "Enable or disable highlighting instantly with a command or keyboard shortcut, no distractions.",
  },
  {
    title: "Color Presets & Customization",
    description:
      "Built-in color presets for light and dark themes, plus full control if you want to customize every highlight color.",
  },
  {
    title: "Lightweight & Non-Intrusive",
    description:
      "No linting, no formatting, no AST transforms. Tailwind Prism only adds clarity.",
  },
  {
    title: "Works With Real-World Patterns",
    description:
      "Supports className, cn(), clsx(), template literals, and conditional class logic out of the box.",
  },
  {
    title: "Respects Your Editor Theme",
    description:
      "Designed to work alongside your existing VS Code theme, not fight it.",
  },
];

export const DOWNLOAD_LINKS = [
  {
    title: "VS Code",
    url: siteConfig.links.vscodeMarketplace,
    icon: Icons.vscode,
  },
  {
    title: "Cursor",
    url: siteConfig.links.openVsxMarketplace,
    icon: Icons.cursor,
  },
  {
    title: "Windsurf",
    url: siteConfig.links.openVsxMarketplace,
    icon: Icons.windsurf,
  },
];
