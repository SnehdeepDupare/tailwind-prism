import { Icons } from "@/components/icons";
import { siteConfig } from "./site";

import {
  IconStack3,
  IconCursorText,
  IconToggleRight,
  IconPalette,
  IconPuzzle,
  IconFeather,
} from "@tabler/icons-react";

export const FEATURES = [
  {
    title: "Semantic Highlighting",
    description:
      "Highlights Tailwind utilities based on what they mean, variants, modifiers, arbitrary values, not just raw strings.",
    icon: IconStack3,
  },
  {
    title: "Full File or Cursor Mode",
    description:
      "Choose between highlighting all Tailwind classes in a file or only the active class block under your cursor.",
    icon: IconCursorText,
  },
  {
    title: "Toggleable, On Your Terms",
    description:
      "Enable or disable highlighting instantly with a command or keyboard shortcut, no distractions.",
    icon: IconToggleRight,
  },
  {
    title: "Color Presets & Customization",
    description:
      "Built-in color presets for light and dark themes, plus full control if you want to customize every highlight color.",
    icon: IconPalette,
  },
  {
    title: "Works With Real-World Patterns",
    description:
      "Supports className, cn(), clsx(), template literals, and conditional class logic out of the box.",
    icon: IconPuzzle,
  },
  {
    title: "Lightweight & Non-Intrusive",
    description:
      "No linting, no formatting, no AST transforms. Tailwind Prism only adds clarity.",
    icon: IconFeather,
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
