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

type CommentRange = {
  start: number;
  end: number;
};

type FunctionCallContext = {
  args: string;
  argsStart: number;
  callStart: number;
  callEnd: number;
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
const FIRST_RUN_KEY = "tailwindPrism.hasCompletedFirstRun";

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

export async function maybeEnableOnFirstRun(
  context: vscode.ExtensionContext,
) {
  const hasCompleted = context.globalState.get<boolean>(FIRST_RUN_KEY, false);

  if (hasCompleted) {
    return;
  }

  const config = vscode.workspace.getConfiguration("tailwindPrism");
  const enabledSetting = config.inspect<boolean>("enabled");
  const hasUserValue =
    enabledSetting?.globalValue !== undefined ||
    enabledSetting?.workspaceValue !== undefined ||
    enabledSetting?.workspaceFolderValue !== undefined;

  if (!hasUserValue) {
    await config.update("enabled", true, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(
      "Tailwind Prism is enabled. You can toggle it anytime using Ctrl+Alt+T or from the status bar.",
    );
  }

  await context.globalState.update(FIRST_RUN_KEY, true);
}

export async function activate(context: vscode.ExtensionContext) {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );

  statusBarItem.text = "$(symbol-color) Tailwind Prism";
  statusBarItem.command = "tailwind-prism.menu";
  context.subscriptions.push(statusBarItem);

  await maybeEnableOnFirstRun(context);

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
  text: string,
  offset: number,
  commentRanges: CommentRange[],
): { value: string; baseIndex: number; type?: string } | null {
  if (isOffsetInComment(offset, commentRanges)) {
    return null;
  }

  const isCommentAtOffset = createCommentOffsetChecker(commentRanges);

  // class / className="..."
  const classRegex = /(className|class)\s*=\s*"([^"]+)"/g;

  let match: RegExpExecArray | null;

  while ((match = classRegex.exec(text))) {
    if (isCommentAtOffset(match.index)) {
      continue;
    }

    const value = match[2];
    const baseIndex = match.index + match[0].indexOf(value);

    if (offset >= baseIndex && offset <= baseIndex + value.length) {
      return { value, baseIndex };
    }
  }

  const functionCalls = getTailwindFunctionCalls(text, commentRanges);

  for (const call of functionCalls) {
    if (isCommentAtOffset(call.callStart)) {
      continue;
    }

    if (offset >= call.callStart && offset <= call.callEnd) {
      return {
        value: call.args,
        baseIndex: call.argsStart,
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

  const text = editor.document.getText();
  const commentRanges = getCommentRanges(text);

  const ranges = {
    variantRanges: [] as vscode.Range[],
    importantRanges: [] as vscode.Range[],
    arbitraryRanges: [] as vscode.Range[],
    utilityRanges: [] as vscode.Range[],
  };

  if (highlightMode === "cursor") {
    const cursorOffset = editor.document.offsetAt(editor.selection.active);

    const context = getTailwindContextAtCursor(text, cursorOffset, commentRanges);

    if (!context) {
      return;
    }

    if (context.type === "function") {
      // process ALL strings + templates inside cn(...)
      const args = context.value;
      const isCommentAtOffset = createCommentOffsetChecker(commentRanges);

      // strings
      const stringRegex = /"([^"]+)"/g;
      let strMatch: RegExpExecArray | null;

      while ((strMatch = stringRegex.exec(args))) {
        const rawStart = context.baseIndex + strMatch.index;
        if (isCommentAtOffset(rawStart)) {
          continue;
        }

        const value = strMatch[1];
        const baseIndex = context.baseIndex + strMatch.index + 1;

        processClassString(value, baseIndex, editor.document, ranges);
      }

      // template literals
      const templateRegex = /`([^`]*)`/g;
      let tplMatch: RegExpExecArray | null;

      while ((tplMatch = templateRegex.exec(args))) {
        const rawStart = context.baseIndex + tplMatch.index;
        if (isCommentAtOffset(rawStart)) {
          continue;
        }

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
    const isCommentAtOffset = createCommentOffsetChecker(commentRanges);

    // class / className
    const classRegex = /(className|class)\s*=\s*"([^"]+)"/g;

    let match: RegExpExecArray | null;

    while ((match = classRegex.exec(text))) {
      if (isCommentAtOffset(match.index)) {
        continue;
      }

      const value = match[2];
      const baseIndex = match.index + match[0].indexOf(value);

      processClassString(value, baseIndex, editor.document, ranges);
    }

    const functionCalls = getTailwindFunctionCalls(text, commentRanges);

    for (const call of functionCalls) {
      if (isCommentAtOffset(call.callStart)) {
        continue;
      }

      const args = call.args;
      const argsStart = call.argsStart;
      const isCommentInArgsAtOffset = createCommentOffsetChecker(commentRanges);

      // strings
      const stringRegex = /"([^"]+)"/g;
      let strMatch: RegExpExecArray | null;

      while ((strMatch = stringRegex.exec(args))) {
        const rawStart = argsStart + strMatch.index;
        if (isCommentInArgsAtOffset(rawStart)) {
          continue;
        }

        const value = strMatch[1];
        const baseIndex = argsStart + strMatch.index + 1;

        processClassString(value, baseIndex, editor.document, ranges);
      }

      // template literals
      const templateRegex = /`([^`]*)`/g;
      let tplMatch: RegExpExecArray | null;

      while ((tplMatch = templateRegex.exec(args))) {
        const rawStart = argsStart + tplMatch.index;
        if (isCommentInArgsAtOffset(rawStart)) {
          continue;
        }

        const value = tplMatch[1];
        const baseIndex = argsStart + tplMatch.index + 1;

        processTemplateLiteral(value, baseIndex, editor.document, ranges);
      }
    }
  }

  applyDecorations(editor, ranges);
}

function getCommentRanges(text: string): CommentRange[] {
  const ranges: CommentRange[] = [];
  const length = text.length;

  let i = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplate = false;

  while (i < length) {
    const char = text[i];

    if (inSingleQuote) {
      if (char === "'" && !isEscaped(text, i)) {
        inSingleQuote = false;
      }
      i += 1;
      continue;
    }

    if (inDoubleQuote) {
      if (char === '"' && !isEscaped(text, i)) {
        inDoubleQuote = false;
      }
      i += 1;
      continue;
    }

    if (inTemplate) {
      if (char === "`" && !isEscaped(text, i)) {
        inTemplate = false;
      }
      i += 1;
      continue;
    }

    if (char === "'") {
      inSingleQuote = true;
      i += 1;
      continue;
    }

    if (char === '"') {
      inDoubleQuote = true;
      i += 1;
      continue;
    }

    if (char === "`") {
      inTemplate = true;
      i += 1;
      continue;
    }

    if (text.startsWith("//", i) && text[i - 1] !== ":") {
      const start = i;
      i += 2;

      while (i < length && text[i] !== "\n") {
        i += 1;
      }

      ranges.push({ start, end: i });
      continue;
    }

    if (char === "#" && isHashLineCommentStart(text, i)) {
      const start = i;
      i += 1;

      while (i < length && text[i] !== "\n") {
        i += 1;
      }

      ranges.push({ start, end: i });
      continue;
    }

    if (text.startsWith("/*", i)) {
      const start = i;
      const closeIndex = text.indexOf("*/", i + 2);

      if (closeIndex === -1) {
        ranges.push({ start, end: length });
        break;
      }

      i = closeIndex + 2;
      ranges.push({ start, end: i });
      continue;
    }

    if (text.startsWith("<!--", i)) {
      const start = i;
      const closeIndex = text.indexOf("-->", i + 4);

      if (closeIndex === -1) {
        ranges.push({ start, end: length });
        break;
      }

      i = closeIndex + 3;
      ranges.push({ start, end: i });
      continue;
    }

    i += 1;
  }

  return ranges;
}

function createCommentOffsetChecker(commentRanges: CommentRange[]) {
  return (offset: number) => isOffsetInComment(offset, commentRanges);
}

function getTailwindFunctionCalls(
  text: string,
  commentRanges: CommentRange[],
): FunctionCallContext[] {
  const calls: FunctionCallContext[] = [];
  const callStartRegex = /\b(cn|clsx|classnames)\s*\(/g;
  const isCommentAtOffset = createCommentOffsetChecker(commentRanges);

  let match: RegExpExecArray | null;

  while ((match = callStartRegex.exec(text))) {
    const callStart = match.index;
    if (isCommentAtOffset(callStart)) {
      continue;
    }

    const openParenIndex = callStart + match[0].length - 1;
    const closeParenIndex = findMatchingParen(text, openParenIndex, isCommentAtOffset);

    if (closeParenIndex === -1) {
      continue;
    }

    const argsStart = openParenIndex + 1;
    const argsEnd = closeParenIndex;

    calls.push({
      args: text.slice(argsStart, argsEnd),
      argsStart,
      callStart,
      callEnd: closeParenIndex + 1,
    });

    callStartRegex.lastIndex = closeParenIndex + 1;
  }

  return calls;
}

function findMatchingParen(
  text: string,
  openParenIndex: number,
  isCommentAtOffset: (offset: number) => boolean,
): number {
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplate = false;

  for (let i = openParenIndex; i < text.length; i += 1) {
    if (isCommentAtOffset(i)) {
      continue;
    }

    const char = text[i];

    if (inSingleQuote) {
      if (char === "'" && !isEscaped(text, i)) {
        inSingleQuote = false;
      }
      continue;
    }

    if (inDoubleQuote) {
      if (char === '"' && !isEscaped(text, i)) {
        inDoubleQuote = false;
      }
      continue;
    }

    if (inTemplate) {
      if (char === "`" && !isEscaped(text, i)) {
        inTemplate = false;
      }
      continue;
    }

    if (char === "'") {
      inSingleQuote = true;
      continue;
    }

    if (char === '"') {
      inDoubleQuote = true;
      continue;
    }

    if (char === "`") {
      inTemplate = true;
      continue;
    }

    if (char === "(") {
      depth += 1;
      continue;
    }

    if (char === ")") {
      depth -= 1;

      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
}

function isOffsetInComment(offset: number, commentRanges: CommentRange[]): boolean {
  let left = 0;
  let right = commentRanges.length - 1;

  while (left <= right) {
    const mid = (left + right) >> 1;
    const range = commentRanges[mid];

    if (offset < range.start) {
      right = mid - 1;
      continue;
    }

    if (offset >= range.end) {
      left = mid + 1;
      continue;
    }

    return true;
  }

  return false;
}

function isHashLineCommentStart(text: string, index: number): boolean {
  let cursor = index - 1;

  while (cursor >= 0 && text[cursor] !== "\n") {
    if (text[cursor] !== " " && text[cursor] !== "\t" && text[cursor] !== "\r") {
      return false;
    }

    cursor -= 1;
  }

  return true;
}

function isEscaped(text: string, index: number): boolean {
  let slashCount = 0;
  let cursor = index - 1;

  while (cursor >= 0 && text[cursor] === "\\") {
    slashCount += 1;
    cursor -= 1;
  }

  return slashCount % 2 === 1;
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
  const tokens = tokenizeClassTokens(value);

  for (const token of tokens) {
    const part = token.value;
    const start = baseIndex + token.start;
    const startPos = document.positionAt(start);

    const variantPrefixLength = getVariantPrefixLength(part);
    if (variantPrefixLength > 0) {
      ranges.variantRanges.push(
        new vscode.Range(
          startPos,
          startPos.translate(0, variantPrefixLength),
        ),
      );
    }

    const importantIndex = variantPrefixLength;
    if (part[importantIndex] === "!") {
      ranges.importantRanges.push(
        new vscode.Range(
          startPos.translate(0, importantIndex),
          startPos.translate(0, importantIndex + 1),
        ),
      );
    }

    const arbitraryRanges = getArbitraryBracketRanges(part);
    for (const range of arbitraryRanges) {
      ranges.arbitraryRanges.push(
        new vscode.Range(
          startPos.translate(0, range.start),
          startPos.translate(0, range.end),
        ),
      );
    }

    // utility fallback
    ranges.utilityRanges.push(
      new vscode.Range(startPos, startPos.translate(0, part.length)),
    );
  }
}

function tokenizeClassTokens(value: string): Array<{ value: string; start: number }> {
  const tokens: Array<{ value: string; start: number }> = [];
  let tokenStart = -1;

  let squareDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];

    if (inSingleQuote) {
      if (char === "'" && !isEscaped(value, i)) {
        inSingleQuote = false;
      }
      continue;
    }

    if (inDoubleQuote) {
      if (char === '"' && !isEscaped(value, i)) {
        inDoubleQuote = false;
      }
      continue;
    }

    if (char === "'" && squareDepth > 0) {
      inSingleQuote = true;
      continue;
    }

    if (char === '"' && squareDepth > 0) {
      inDoubleQuote = true;
      continue;
    }

    if (char === "[") {
      squareDepth += 1;
    } else if (char === "]" && squareDepth > 0) {
      squareDepth -= 1;
    }

    const isBoundary =
      (char === " " || char === "\n" || char === "\t" || char === "\r") &&
      squareDepth === 0;

    if (isBoundary) {
      if (tokenStart !== -1) {
        tokens.push({ value: value.slice(tokenStart, i), start: tokenStart });
        tokenStart = -1;
      }
      continue;
    }

    if (tokenStart === -1) {
      tokenStart = i;
    }
  }

  if (tokenStart !== -1) {
    tokens.push({ value: value.slice(tokenStart), start: tokenStart });
  }

  return tokens;
}

function getVariantPrefixLength(part: string): number {
  let squareDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let prefixLength = 0;

  for (let i = 0; i < part.length; i += 1) {
    const char = part[i];

    if (inSingleQuote) {
      if (char === "'" && !isEscaped(part, i)) {
        inSingleQuote = false;
      }
      continue;
    }

    if (inDoubleQuote) {
      if (char === '"' && !isEscaped(part, i)) {
        inDoubleQuote = false;
      }
      continue;
    }

    if (char === "'" && squareDepth > 0) {
      inSingleQuote = true;
      continue;
    }

    if (char === '"' && squareDepth > 0) {
      inDoubleQuote = true;
      continue;
    }

    if (char === "[") {
      squareDepth += 1;
      continue;
    }

    if (char === "]" && squareDepth > 0) {
      squareDepth -= 1;
      continue;
    }

    if (char === ":" && squareDepth === 0) {
      prefixLength = i + 1;
    }
  }

  return prefixLength;
}

function getArbitraryBracketRanges(part: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  const stack: number[] = [];

  for (let i = 0; i < part.length; i += 1) {
    const char = part[i];

    if (char === "[") {
      stack.push(i);
      continue;
    }

    if (char === "]" && stack.length > 0) {
      const start = stack.pop();
      if (start !== undefined) {
        ranges.push({ start, end: i + 1 });
      }
    }
  }

  return ranges;
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
