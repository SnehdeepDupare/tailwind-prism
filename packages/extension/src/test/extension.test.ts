import * as assert from "assert";
import * as vscode from "vscode";
import { maybeEnableOnFirstRun } from "../extension";

type MockMemento = vscode.Memento & {
  store: Map<string, unknown>;
  setKeysForSync: (keys: readonly string[]) => void;
  keys: () => readonly string[];
};

function createMockMemento(): MockMemento {
  const store = new Map<string, unknown>();

  return {
    store,
    get: <T>(key: string, defaultValue?: T) => {
      if (store.has(key)) {
        return store.get(key) as T;
      }
      return defaultValue as T;
    },
    update: async (key: string, value: unknown) => {
      store.set(key, value);
      return;
    },
    setKeysForSync: () => {
      return;
    },
    keys: () => Array.from(store.keys()),
  };
}

type InspectResult<T> = {
  key: string;
  defaultValue?: T;
  globalValue?: T;
  workspaceValue?: T;
  workspaceFolderValue?: T;
};

type MockConfiguration = {
  get: <T>(section: string, defaultValue?: T) => T;
  update: (section: string, value: unknown) => Promise<void>;
  inspect: <T>(section: string) => InspectResult<T> | undefined;
  setUserValue: (value: boolean | undefined) => void;
};

function createMockConfiguration(): MockConfiguration {
  let enabledValue: boolean | undefined;
  let hasUserValue = false;

  return {
    get: <T>(_section: string, defaultValue?: T) => {
      if (enabledValue === undefined) {
        return defaultValue as T;
      }
      return enabledValue as T;
    },
    update: async (_section: string, value: unknown) => {
      enabledValue = value as boolean | undefined;
      hasUserValue = value !== undefined;
    },
    inspect: <T>(_section: string) => {
      if (!hasUserValue) {
        return {
          key: "enabled",
          defaultValue: false as T,
        } as InspectResult<T>;
      }

      return {
        key: "enabled",
        defaultValue: false as T,
        globalValue: enabledValue as T,
      } as InspectResult<T>;
    },
    setUserValue: (value: boolean | undefined) => {
      enabledValue = value;
      hasUserValue = value !== undefined;
    },
  };
}

function createMockContext(): vscode.ExtensionContext {
  const globalState = createMockMemento();
  const emptyUri = vscode.Uri.file("");
  const environmentCollection = {
    persistent: false,
    description: undefined,
    append: () => {
      return;
    },
    prepend: () => {
      return;
    },
    replace: () => {
      return;
    },
    get: () => undefined,
    forEach: () => {
      return;
    },
    delete: () => {
      return;
    },
    clear: () => {
      return;
    },
    [Symbol.iterator]: () => [][Symbol.iterator](),
    getScoped: () => undefined,
  } as unknown as vscode.GlobalEnvironmentVariableCollection;

  return {
    subscriptions: [],
    extensionUri: emptyUri,
    extensionPath: "",
    globalState,
    workspaceState: createMockMemento(),
    storageUri: emptyUri,
    globalStorageUri: emptyUri,
    logUri: emptyUri,
    storagePath: "",
    globalStoragePath: "",
    logPath: "",
    languageModelAccessInformation: undefined as unknown as vscode.LanguageModelAccessInformation,
    extensionMode: vscode.ExtensionMode.Test,
    extension: undefined as unknown as vscode.Extension<unknown>,
    environmentVariableCollection: environmentCollection,
    secrets: undefined as unknown as vscode.SecretStorage,
    asAbsolutePath: (relativePath: string) => relativePath,
  };
}

suite("Extension First-Run Test Suite", () => {
  const originalShowMessage = vscode.window.showInformationMessage;
  const originalGetConfiguration = vscode.workspace.getConfiguration;
  let messageCalls = 0;
  let mockConfig: MockConfiguration;

  setup(async () => {
    messageCalls = 0;
    (vscode.window as unknown as { showInformationMessage: () => void }).showInformationMessage =
      () => {
        messageCalls += 1;
      };

    mockConfig = createMockConfiguration();
    (vscode.workspace as unknown as { getConfiguration: () => MockConfiguration }).getConfiguration =
      () => mockConfig;
  });

  teardown(async () => {
    (vscode.window as unknown as { showInformationMessage: () => void }).showInformationMessage =
      originalShowMessage as unknown as () => void;
    (vscode.workspace as unknown as { getConfiguration: () => vscode.WorkspaceConfiguration }).getConfiguration =
      originalGetConfiguration;
  });

  test("enables extension and shows toast on first run when setting is untouched", async () => {
    const context = createMockContext();

    await maybeEnableOnFirstRun(context);

    assert.strictEqual(
      mockConfig.get<boolean>("enabled"),
      true,
    );
    assert.strictEqual(messageCalls, 1);
    assert.strictEqual(
      context.globalState.get("tailwindPrism.hasCompletedFirstRun"),
      true,
    );
  });

  test("does not override explicit enabled setting", async () => {
    const context = createMockContext();
    mockConfig.setUserValue(false);

    await maybeEnableOnFirstRun(context);

    assert.strictEqual(
      mockConfig.get<boolean>("enabled"),
      false,
    );
    assert.strictEqual(messageCalls, 0);
    assert.strictEqual(
      context.globalState.get("tailwindPrism.hasCompletedFirstRun"),
      true,
    );
  });

  test("does nothing after first run completed", async () => {
    const context = createMockContext();

    await context.globalState.update("tailwindPrism.hasCompletedFirstRun", true);
    await maybeEnableOnFirstRun(context);

    assert.strictEqual(messageCalls, 0);
  });
});
