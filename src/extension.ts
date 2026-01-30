import * as vscode from "vscode";

let enabled = false;
let decorations: vscode.TextEditorDecorationType[] = [];

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

  context.subscriptions.push(toggle);

  vscode.window.onDidChangeActiveTextEditor(updateEditor);
  vscode.workspace.onDidChangeTextDocument(() =>
    updateEditor(vscode.window.activeTextEditor),
  );
}

function updateEditor(editor?: vscode.TextEditor) {
  if (!enabled || !editor) return;

  clearDecorations();

  const text = editor.document.getText();

  const ranges = {
    variantRanges: [] as vscode.Range[],
    importantRanges: [] as vscode.Range[],
    arbitraryRanges: [] as vscode.Range[],
    utilityRanges: [] as vscode.Range[],
  };

  // class / className="..."
  const classRegex = /(className|class)\s*=\s*"([^"]+)"/g;

  let match: RegExpExecArray | null;

  while ((match = classRegex.exec(text))) {
    const classValue = match[2];
    const baseIndex = match.index + match[0].indexOf(classValue);

    processClassString(classValue, baseIndex, editor.document, ranges);
  }

  // cn("...", ...)
  const cnRegex = /\bcn\s*\(([\s\S]*?)\)/g;

  while ((match = cnRegex.exec(text))) {
    const args = match[1];
    let strMatch: RegExpExecArray | null;

    // match string literals
    const stringRegex = /"([^"]+)"/g;

    // match template literals
    const templateRegex = /`([^`]*)`/g;

    // strings
    while ((strMatch = stringRegex.exec(args))) {
      const value = strMatch[1];

      const baseIndex = match.index + match[0].indexOf(strMatch[0]) + 1;

      processClassString(value, baseIndex, editor.document, ranges);
    }

    // template literals
    let tplMatch: RegExpExecArray | null;

    while ((tplMatch = templateRegex.exec(args))) {
      const value = tplMatch[1];

      const baseIndex = match.index + match[0].indexOf(tplMatch[0]) + 1;

      processTemplateLiteral(value, baseIndex, editor.document, ranges);
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
    if (!part) continue;

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
