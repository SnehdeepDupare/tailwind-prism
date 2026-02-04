import * as vscode from "vscode";

type HighlightMode = "full" | "cursor";

type ModePickItem = vscode.QuickPickItem & {
  value: HighlightMode;
};

type PrismColors = {
  variant: string;
  important: string;
  arbitrary: string;
  utility: string;
};

const PRESETS: Record<string, PrismColors> = {
  Clear: {
    variant: "#2563EB",
    important: "#DC2626",
    arbitrary: "#B45309",
    utility: "#1F2937",
  },
  Soft: {
    variant: "#4F46E5",
    important: "#E11D48",
    arbitrary: "#CA8A04",
    utility: "#374151",
  },
  Calm: {
    variant: "#7FB4FF",
    important: "#FF6B81",
    arbitrary: "#F2C97D",
    utility: "#D1D7E0",
  },
  Contrast: {
    variant: "#93C5FD",
    important: "#FB7185",
    arbitrary: "#FACC15",
    utility: "#E5E7EB",
  },
  Muted: {
    variant: "#9CA3AF",
    important: "#F87171",
    arbitrary: "#D4B483",
    utility: "#9CA3AF",
  },
};

let decorationTypes: {
  variant: vscode.TextEditorDecorationType;
  important: vscode.TextEditorDecorationType;
  arbitrary: vscode.TextEditorDecorationType;
  utility: vscode.TextEditorDecorationType;
} | null = null;
let statusBarItem: vscode.StatusBarItem;

const TOGGLE_HINT_KEY = "tailwindPrism.hasSeenToggleShortcutHint";

async function maybeShowToggleShortcutHint(context: vscode.ExtensionContext) {
  const hasSeen = context.globalState.get<boolean>(TOGGLE_HINT_KEY, false);

  if (hasSeen) {
    return;
  }

  const shortcut = process.platform === "darwin" ? "⌘⌥T" : "Ctrl+Alt+T";

  vscode.window.showInformationMessage(
    `Tip: You can toggle Tailwind Prism using ${shortcut}`,
  );

  await context.globalState.update(TOGGLE_HINT_KEY, true);
}

function isEnabled(): boolean {
  const config = vscode.workspace.getConfiguration("tailwindPrism");
  return config.get<boolean>("enabled", false);
}

function updateStatusBar() {
  if (!statusBarItem) {
    return;
  }

  const enabled = isEnabled();

  statusBarItem.text = isEnabled()
    ? `$(symbol-color) Prism · ${getHighlightMode()}`
    : "$(symbol-color) Prism · Off";

  statusBarItem.tooltip = enabled
    ? "Click to disable Tailwind Prism"
    : "Click to enable Tailwind Prism";

  statusBarItem.show();
}

async function openStatusBarMenu(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration("tailwindPrism");

  const enabled = config.get<boolean>("enabled", false);
  const mode = config.get<HighlightMode>("highlightMode", "full");
  const preset = config.get<string>("colorPreset", "Calm");

  type MenuItem = vscode.QuickPickItem & {
    action: "toggle" | "mode" | "preset" | "customize" | "keybindings";
  };

  const items: MenuItem[] = [
    {
      label: enabled ? "Disable Tailwind Prism" : "Enable Tailwind Prism",
      description: "Toggle highlighting",
      action: "toggle",
    },
    {
      label: "Highlight Mode",
      description: mode === "full" ? "Full file" : "Cursor only",
      action: "mode",
    },
    {
      label: "Color Preset",
      description: preset,
      action: "preset",
    },
    {
      label: "Customize Colors…",
      description: "Open Tailwind Prism settings",
      action: "customize",
    },
    {
      label: "Keyboard Shortcuts…",
      description: "Customize Tailwind Prism keybindings",
      action: "keybindings",
    },
  ];

  const choice = await vscode.window.showQuickPick(items, {
    placeHolder: "Tailwind Prism",
  });

  if (!choice) {
    return;
  }

  switch (choice.action) {
    case "toggle": {
      await config.update(
        "enabled",
        !enabled,
        vscode.ConfigurationTarget.Global,
      );

      if (!enabled) {
        updateEditor(vscode.window.activeTextEditor);
      } else {
        clearDecorations();
      }

      updateStatusBar();

      await maybeShowToggleShortcutHint(context);
      break;
    }

    case "mode": {
      vscode.commands.executeCommand("tailwind-prism.selectMode");
      break;
    }

    case "preset": {
      vscode.commands.executeCommand("tailwind-prism.selectPreset");
      break;
    }

    case "customize": {
      vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "tailwindPrism",
      );
      break;
    }

    case "keybindings": {
      vscode.commands.executeCommand(
        "workbench.action.openGlobalKeybindings",
        "tailwind-prism",
      );
      break;
    }
  }
}

function getHighlightMode(): "full" | "cursor" {
  const config = vscode.workspace.getConfiguration("tailwindPrism");
  return config.get<"full" | "cursor">("highlightMode", "full");
}

function getPrismColors(): PrismColors {
  const config = vscode.workspace.getConfiguration("tailwindPrism");

  const presetName = config.get<string>("colorPreset", "Calm");

  const preset = PRESETS[presetName] ?? PRESETS.Calm;

  return {
    variant: config.get<string>("colors.variant") || preset.variant,
    important: config.get<string>("colors.important") || preset.important,
    arbitrary: config.get<string>("colors.arbitrary") || preset.arbitrary,
    utility: config.get<string>("colors.utility") || preset.utility,
  };
}

export function activate(context: vscode.ExtensionContext) {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );

  statusBarItem.text = "$(symbol-color) Tailwind Prism";
  statusBarItem.command = "tailwind-prism.menu";
  context.subscriptions.push(statusBarItem);

  updateStatusBar();

  context.subscriptions.push(
    vscode.commands.registerCommand("tailwind-prism.toggle", async () => {
      const config = vscode.workspace.getConfiguration("tailwindPrism");

      const next = !config.get<boolean>("enabled", false);

      await config.update("enabled", next, vscode.ConfigurationTarget.Global);

      if (!next) {
        clearDecorations();
      } else {
        updateEditor(vscode.window.activeTextEditor);
      }

      updateStatusBar();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("tailwind-prism.selectMode", async () => {
      const choice = await vscode.window.showQuickPick<ModePickItem>(
        [
          {
            label: "Full file",
            description: "Highlight all Tailwind classnames in the file",
            value: "full",
          },
          {
            label: "Cursor only",
            description: "Highlight only the active class block",
            value: "cursor",
          },
        ],
        {
          placeHolder: "Select Tailwind Prism highlight mode",
        },
      );

      if (!choice) {
        return;
      }

      await vscode.workspace
        .getConfiguration("tailwindPrism")
        .update(
          "highlightMode",
          choice.value,
          vscode.ConfigurationTarget.Global,
        );

      updateEditor(vscode.window.activeTextEditor);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "tailwind-prism.selectPreset",
      selectColorPreset,
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("tailwind-prism.menu", () =>
      openStatusBarMenu(context),
    ),
  );

  if (isEnabled()) {
    updateEditor(vscode.window.activeTextEditor);
  }

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(updateEditor),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(() =>
      updateEditor(vscode.window.activeTextEditor),
    ),
  );

  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection((e) => {
      if (getHighlightMode() === "cursor") {
        updateEditor(e.textEditor);
      }
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("tailwindPrism")) {
        const config = vscode.workspace.getConfiguration("tailwindPrism");
        const enabled = config.get<boolean>("enabled", false);

        if (!enabled) {
          clearDecorations();
        } else if (isEnabled()) {
          updateEditor(vscode.window.activeTextEditor);
        }

        updateStatusBar();
      }
    }),
  );
}

function getTailwindContextAtCursor(
  document: vscode.TextDocument,
  offset: number,
): { value: string; baseIndex: number; type?: string } | null {
  const text = document.getText();

  // class / className="..."
  const classRegex = /(className|class)\s*=\s*"([^"]+)"/g;

  let match: RegExpExecArray | null;

  while ((match = classRegex.exec(text))) {
    const value = match[2];
    const baseIndex = match.index + match[0].indexOf(value);

    if (offset >= baseIndex && offset <= baseIndex + value.length) {
      return { value, baseIndex };
    }
  }

  // cn / clsx / classnames
  const fnRegex = /\b(cn|clsx|classnames)\s*\(([\s\S]*?)\)/g;

  while ((match = fnRegex.exec(text))) {
    const fullCall = match[0];
    const args = match[2];

    const callStart = match.index;
    const callEnd = callStart + fullCall.length;

    // cursor anywhere inside the call
    if (offset >= callStart && offset <= callEnd) {
      return {
        value: args, // ENTIRE argument list
        baseIndex: match.index + match[0].indexOf(args),
        type: "function",
      };
    }
  }

  return null;
}

function updateEditor(editor?: vscode.TextEditor) {
  const highlightMode = getHighlightMode();

  if (!isEnabled() || !editor) {
    clearDecorations();
    return;
  }

  clearDecorations();

  const ranges = {
    variantRanges: [] as vscode.Range[],
    importantRanges: [] as vscode.Range[],
    arbitraryRanges: [] as vscode.Range[],
    utilityRanges: [] as vscode.Range[],
  };

  if (highlightMode === "cursor") {
    const cursorOffset = editor.document.offsetAt(editor.selection.active);

    const context = getTailwindContextAtCursor(editor.document, cursorOffset);

    if (!context) {
      return;
    }

    if (context.type === "function") {
      // process ALL strings + templates inside cn(...)
      const args = context.value;

      // strings
      const stringRegex = /"([^"]+)"/g;
      let strMatch: RegExpExecArray | null;

      while ((strMatch = stringRegex.exec(args))) {
        const value = strMatch[1];
        const baseIndex = context.baseIndex + strMatch.index + 1;

        processClassString(value, baseIndex, editor.document, ranges);
      }

      // template literals
      const templateRegex = /`([^`]*)`/g;
      let tplMatch: RegExpExecArray | null;

      while ((tplMatch = templateRegex.exec(args))) {
        const value = tplMatch[1];
        const baseIndex = context.baseIndex + tplMatch.index + 1;

        processTemplateLiteral(value, baseIndex, editor.document, ranges);
      }
    } else {
      // className="..."
      processClassString(
        context.value,
        context.baseIndex,
        editor.document,
        ranges,
      );
    }
  } else {
    // ✅ FULL FILE MODE
    const text = editor.document.getText();

    // class / className
    const classRegex = /(className|class)\s*=\s*"([^"]+)"/g;

    let match: RegExpExecArray | null;

    while ((match = classRegex.exec(text))) {
      const value = match[2];
      const baseIndex = match.index + match[0].indexOf(value);

      processClassString(value, baseIndex, editor.document, ranges);
    }

    // cn / clsx / classnames
    const fnRegex = /\b(cn|clsx|classnames)\s*\(([\s\S]*?)\)/g;

    while ((match = fnRegex.exec(text))) {
      const args = match[2];

      // strings
      const stringRegex = /"([^"]+)"/g;
      let strMatch: RegExpExecArray | null;

      while ((strMatch = stringRegex.exec(args))) {
        const value = strMatch[1];
        const baseIndex = match.index + match[0].indexOf(strMatch[0]) + 1;

        processClassString(value, baseIndex, editor.document, ranges);
      }

      // template literals
      const templateRegex = /`([^`]*)`/g;
      let tplMatch: RegExpExecArray | null;

      while ((tplMatch = templateRegex.exec(args))) {
        const value = tplMatch[1];
        const baseIndex = match.index + match[0].indexOf(tplMatch[0]) + 1;

        processTemplateLiteral(value, baseIndex, editor.document, ranges);
      }
    }
  }

  applyDecorations(editor, ranges);
}

function processClassString(
  value: string,
  baseIndex: number,
  document: vscode.TextDocument,
  ranges: {
    variantRanges: vscode.Range[];
    importantRanges: vscode.Range[];
    arbitraryRanges: vscode.Range[];
    utilityRanges: vscode.Range[];
  },
) {
  const parts = value.split(/\s+/);
  let offset = 0;

  for (const part of parts) {
    if (!part) {
      continue;
    }

    const start = baseIndex + offset;
    const startPos = document.positionAt(start);

    // variant: hover:, dark:, sm:
    const variantMatch = part.match(/^([a-z-]+:)/);
    if (variantMatch) {
      ranges.variantRanges.push(
        new vscode.Range(
          startPos,
          startPos.translate(0, variantMatch[1].length),
        ),
      );
    }

    // important: !
    if (part.startsWith("!")) {
      ranges.importantRanges.push(
        new vscode.Range(startPos, startPos.translate(0, 1)),
      );
    }

    // arbitrary: [state=open]
    const arbitraryMatch = part.match(/\[[^\]]+\]/);
    if (arbitraryMatch) {
      const i = part.indexOf(arbitraryMatch[0]);
      ranges.arbitraryRanges.push(
        new vscode.Range(
          startPos.translate(0, i),
          startPos.translate(0, i + arbitraryMatch[0].length),
        ),
      );
    }

    // utility fallback
    ranges.utilityRanges.push(
      new vscode.Range(startPos, startPos.translate(0, part.length)),
    );

    offset += part.length + 1;
  }
}

function processTemplateLiteral(
  value: string,
  baseIndex: number,
  document: vscode.TextDocument,
  ranges: {
    variantRanges: vscode.Range[];
    importantRanges: vscode.Range[];
    arbitraryRanges: vscode.Range[];
    utilityRanges: vscode.Range[];
  },
) {
  const regex = /\$\{[^}]*\}/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(value))) {
    // Static part before ${...}
    const staticPart = value.slice(lastIndex, match.index);

    if (staticPart.trim()) {
      processClassString(staticPart, baseIndex + lastIndex, document, ranges);
    }

    // Move past ${...}
    lastIndex = match.index + match[0].length;
  }

  // Trailing static part after last ${...}
  const remaining = value.slice(lastIndex);
  if (remaining.trim()) {
    processClassString(remaining, baseIndex + lastIndex, document, ranges);
  }
}

function applyDecorations(
  editor: vscode.TextEditor,
  ranges: {
    variantRanges: vscode.Range[];
    importantRanges: vscode.Range[];
    arbitraryRanges: vscode.Range[];
    utilityRanges: vscode.Range[];
  },
) {
  const colors = getPrismColors();

  if (!decorationTypes) {
    decorationTypes = {
      variant: vscode.window.createTextEditorDecorationType({
        color: colors.variant,
        fontStyle: "italic",
      }),
      important: vscode.window.createTextEditorDecorationType({
        color: colors.important,
        fontWeight: "600",
      }),
      arbitrary: vscode.window.createTextEditorDecorationType({
        color: colors.arbitrary,
      }),
      utility: vscode.window.createTextEditorDecorationType({
        color: colors.utility,
        fontWeight: "500",
      }),
    };
  }

  editor.setDecorations(decorationTypes.variant, ranges.variantRanges);
  editor.setDecorations(decorationTypes.important, ranges.importantRanges);
  editor.setDecorations(decorationTypes.arbitrary, ranges.arbitraryRanges);
  editor.setDecorations(decorationTypes.utility, ranges.utilityRanges);
}

function clearDecorations() {
  if (!decorationTypes) {
    return;
  }

  decorationTypes.variant.dispose();
  decorationTypes.important.dispose();
  decorationTypes.arbitrary.dispose();
  decorationTypes.utility.dispose();

  decorationTypes = null;
}

async function selectColorPreset() {
  const qp = vscode.window.createQuickPick<
    vscode.QuickPickItem & { value: string }
  >();

  qp.title = "Tailwind Prism - Color Presets";
  qp.placeholder = "Use ↑ ↓ to navigate, Enter to confirm";

  qp.items = [
    {
      label: "Clear",
      description: "Light mode · High readability",
      value: "Clear",
    },
    {
      label: "Soft",
      description: "Light mode · Gentle contrast",
      value: "Soft",
    },
    {
      label: "Calm",
      description: "Dark mode · Balanced (recommended)",
      value: "Calm",
    },
    {
      label: "Contrast",
      description: "Dark mode · High contrast",
      value: "Contrast",
    },
    {
      label: "Muted",
      description: "Dark mode · Low visual noise",
      value: "Muted",
    },
    {
      label: "Customize…",
      description: "Open Tailwind Prism color settings",
      value: "__customize__",
    },
  ];

  // CONFIRM
  qp.onDidAccept(async () => {
    const item = qp.selectedItems[0];
    if (!item) {
      return;
    }

    if (item.value === "__customize__") {
      vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "tailwindPrism.colors",
      );
      qp.hide();
      return;
    }

    await vscode.workspace
      .getConfiguration("tailwindPrism")
      .update("colorPreset", item.value, vscode.ConfigurationTarget.Global);

    qp.hide();
  });

  // CANCEL -> REVERT
  qp.onDidHide(() => {
    qp.dispose();
  });

  qp.show();
}

export function deactivate() {
  clearDecorations();
}
