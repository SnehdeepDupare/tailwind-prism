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

  const classRegex = /(className|class)\s*=\s*"([^"]+)"/g;

  const variantRanges: vscode.Range[] = [];
  const importantRanges: vscode.Range[] = [];
  const arbitraryRanges: vscode.Range[] = [];
  const utilityRanges: vscode.Range[] = [];

  let match: RegExpExecArray | null;

  while ((match = classRegex.exec(text))) {
    const classValue = match[2];
    const baseIndex = match.index + match[0].indexOf(classValue);

    const parts = classValue.split(/\s+/);
    let offset = 0;

    for (const part of parts) {
      if (!part) continue;

      const start = baseIndex + offset;
      const startPos = editor.document.positionAt(start);

      // variant: hover:, dark:, sm:
      const variantMatch = part.match(/^([a-z-]+:)/);
      if (variantMatch) {
        variantRanges.push(
          new vscode.Range(
            startPos,
            startPos.translate(0, variantMatch[1].length),
          ),
        );
      }

      // important: !
      if (part.startsWith("!")) {
        importantRanges.push(
          new vscode.Range(startPos, startPos.translate(0, 1)),
        );
      }

      // arbitrary: [state=open]
      const arbitraryMatch = part.match(/\[[^\]]+\]/);
      if (arbitraryMatch) {
        const i = part.indexOf(arbitraryMatch[0]);
        arbitraryRanges.push(
          new vscode.Range(
            startPos.translate(0, i),
            startPos.translate(0, i + arbitraryMatch[0].length),
          ),
        );
      }

      // utility fallback
      utilityRanges.push(
        new vscode.Range(startPos, startPos.translate(0, part.length)),
      );

      offset += part.length + 1;
    }
  }

  applyDecorations(editor, {
    variantRanges,
    importantRanges,
    arbitraryRanges,
    utilityRanges,
  });
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
