import * as vscode from "vscode";

type HighlightMode = "full" | "cursor";

type ModePickItem = vscode.QuickPickItem & {
  value: HighlightMode;
};

let enabled = false;
let decorations: vscode.TextEditorDecorationType[] = [];

function getHighlightMode(): "full" | "cursor" {
  const config = vscode.workspace.getConfiguration("tailwindPrism");
  return config.get<"full" | "cursor">("highlightMode", "full");
}

export function activate(context: vscode.ExtensionContext) {
  const toggle = vscode.commands.registerCommand(
    "tailwind-prism.toggle",
    () => {
      enabled = !enabled;

      if (!enabled) {
        clearDecorations();
        return;
      }

      updateEditor(vscode.window.activeTextEditor);
    },
  );

  const selectMode = vscode.commands.registerCommand(
    "tailwind-prism.selectMode",
    async () => {
      const currentMode = getHighlightMode();

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
    },
  );

  context.subscriptions.push(selectMode);

  context.subscriptions.push(toggle);

  vscode.window.onDidChangeActiveTextEditor(updateEditor);
  vscode.workspace.onDidChangeTextDocument(() =>
    updateEditor(vscode.window.activeTextEditor),
  );
  vscode.window.onDidChangeTextEditorSelection((e) => {
    updateEditor(e.textEditor);
  });
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

  if (!enabled || !editor) {
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
  const variant = vscode.window.createTextEditorDecorationType({
    color: "#7FB4FF",
    fontStyle: "italic",
  });

  const important = vscode.window.createTextEditorDecorationType({
    color: "#FF6B81",
    fontWeight: "600",
  });

  const arbitrary = vscode.window.createTextEditorDecorationType({
    color: "#F2C97D",
  });

  const utility = vscode.window.createTextEditorDecorationType({
    color: "#D1D7E0",
    fontWeight: "500",
  });

  decorations.push(variant, important, arbitrary, utility);

  editor.setDecorations(variant, ranges.variantRanges);
  editor.setDecorations(important, ranges.importantRanges);
  editor.setDecorations(arbitrary, ranges.arbitraryRanges);
  editor.setDecorations(utility, ranges.utilityRanges);
}

function clearDecorations() {
  decorations.forEach((d) => d.dispose());
  decorations = [];
}
