import * as grpc from "grpc";
import * as path from "path";
import * as ttfClient from "./ttf/service_grpc_pb";
import * as vscode from "vscode";

import { BehaviorPanel } from "./behaviorPanel";
import { DefinitionPanel } from "./definitionPanel";
import { FormulaPanel } from "./formulaPanel";
import { HotReloadWatcher } from "./hotReloadWatcher";
import { ITtfInterface } from "./ttfInterface";
import { TokenArtifactExplorer } from "./tokenArtifactExplorer";
import { TokenDefinitionExplorer } from "./tokenDefinitionExplorer";
import { TokenFormulaExplorer } from "./tokenFormulaExplorer";
import { TokenTaxonomy } from "./tokenTaxonomy";
import { TtfFileSystemConnection } from "./ttfFileSystemConnection";

const StatusBarPrefix = "$(debug-disconnect) TTF: ";

export async function activate(context: vscode.ExtensionContext) {
  let panelReloadEvent: vscode.Event<void> = new vscode.EventEmitter<void>()
    .event;
  if (process.env.VSCODE_DEBUG_MODE === "true") {
    const hotReloadWatcher = new HotReloadWatcher(context.extensionPath);
    context.subscriptions.push(hotReloadWatcher);
    panelReloadEvent = hotReloadWatcher.reload;
  }

  const newSandboxConnection = async () =>
    await TtfFileSystemConnection.create(
      path.join(
        context.extensionPath,
        "resources",
        "ttf_snapshot",
        "ttf_taxonomy.bin"
      )
    );

  let currentEnvironment = "Sandbox";
  let ttfConnection: ITtfInterface = await newSandboxConnection();
  let ttfTaxonomy = new TokenTaxonomy(ttfConnection);

  const tokenArtifactExplorer = new TokenArtifactExplorer(
    context.extensionPath,
    ttfTaxonomy
  );

  const tokenFormulaExplorer = new TokenFormulaExplorer(
    context.extensionPath,
    ttfTaxonomy
  );

  const tokenDefinitionExplorer = new TokenDefinitionExplorer(
    context.extensionPath,
    ttfTaxonomy
  );

  const changeEnvironmentCommand = vscode.commands.registerCommand(
    "visual-token-designer.changeEnvironment",
    async (commandContext) => {
      const newServer = await vscode.window.showInputBox({
        prompt:
          "Specifiy the address of the Token Taxonomy Framework GRPC server " +
          "to connect to (e.g. 127.0.0.1:8086). Leave blank to use the sandbox " +
          "(changes made in the sandbox are not persisted).",
        placeHolder: "Enter a hostname (leave blank for sandbox)",
        validateInput: (input) =>
          !input || input.match(/^[-a-z0-9.]+:[0-9]+$/i)
            ? null
            : "Please enter a valid hostname and port number (e.g. 127.0.0.1:8086). " +
              "Leave blank to use the sandbox.",
      });
      if (newServer) {
        ttfConnection = new ttfClient.ServiceClient(
          newServer,
          grpc.credentials.createInsecure()
        );
        currentEnvironment = newServer;
      } else {
        ttfConnection = await newSandboxConnection();
        currentEnvironment = "Sandbox";
      }
      ttfTaxonomy = new TokenTaxonomy(ttfConnection);
      tokenArtifactExplorer.setTaxonomy(ttfTaxonomy);
      tokenFormulaExplorer.setTaxonomy(ttfTaxonomy);
      tokenDefinitionExplorer.setTaxonomy(ttfTaxonomy);
      statusBarItem.text = StatusBarPrefix + currentEnvironment;
      statusBarItem.show();
    }
  );

  const createTokenFormulaCommand = vscode.commands.registerCommand(
    "visual-token-designer.createTokenFormula",
    async (commandContext) => {
      const panel = await FormulaPanel.openNewFormula(
        ttfConnection,
        currentEnvironment,
        ttfTaxonomy,
        context.extensionPath,
        context.subscriptions,
        panelReloadEvent
      );
    }
  );

  const openTokenFormulaCommand = vscode.commands.registerCommand(
    "visual-token-designer.openTokenFormula",
    async (commandContext) => {
      const panel = await FormulaPanel.openExistingFormula(
        commandContext,
        ttfConnection,
        currentEnvironment,
        ttfTaxonomy,
        context.extensionPath,
        context.subscriptions,
        panelReloadEvent
      );
    }
  );

  const createTokenDefinitionCommand = vscode.commands.registerCommand(
    "visual-token-designer.createTokenDefinition",
    async (commandContext) => {
      const panel = await DefinitionPanel.openNewDefinition(
        commandContext?.id || "",
        ttfConnection,
        currentEnvironment,
        ttfTaxonomy,
        context.extensionPath,
        context.subscriptions,
        panelReloadEvent
      );
    }
  );

  const openTokenDefinitionCommand = vscode.commands.registerCommand(
    "visual-token-designer.openTokenDefinition",
    async (commandContext) => {
      const panel = await DefinitionPanel.openExistingDefinition(
        commandContext,
        ttfConnection,
        currentEnvironment,
        ttfTaxonomy,
        context.extensionPath,
        context.subscriptions,
        panelReloadEvent
      );
    }
  );

  const openBehaviorCommand = vscode.commands.registerCommand(
    "visual-token-designer.openBehavior",
    async (commandContext) => {
      const panel = await BehaviorPanel.openExistingBehavior(
        commandContext,
        ttfConnection,
        currentEnvironment,
        ttfTaxonomy,
        context.extensionPath,
        context.subscriptions,
        panelReloadEvent
      );
    }
  );

  const refreshTokenTaxonomyCommand = vscode.commands.registerCommand(
    "visual-token-designer.refreshTokenTaxonomy",
    async (commandContext) => {
      await ttfTaxonomy.refresh();
    }
  );

  const tokenArtifactExplorerProvider = vscode.window.registerTreeDataProvider(
    "visual-token-designer.tokenArtifactExplorer",
    tokenArtifactExplorer
  );

  const tokenFormulaExplorerProvider = vscode.window.registerTreeDataProvider(
    "visual-token-designer.tokenFormulaExplorer",
    tokenFormulaExplorer
  );

  const tokenDefinitionExplorerProvider = vscode.window.registerTreeDataProvider(
    "visual-token-designer.tokenDefinitionExplorer",
    tokenDefinitionExplorer
  );

  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );
  statusBarItem.command = "visual-token-designer.changeEnvironment";
  statusBarItem.text = StatusBarPrefix + currentEnvironment;
  statusBarItem.show();

  context.subscriptions.push(changeEnvironmentCommand);
  context.subscriptions.push(createTokenFormulaCommand);
  context.subscriptions.push(openTokenFormulaCommand);
  context.subscriptions.push(createTokenDefinitionCommand);
  context.subscriptions.push(openTokenDefinitionCommand);
  context.subscriptions.push(openBehaviorCommand);
  context.subscriptions.push(refreshTokenTaxonomyCommand);
  context.subscriptions.push(tokenArtifactExplorerProvider);
  context.subscriptions.push(tokenFormulaExplorerProvider);
  context.subscriptions.push(tokenDefinitionExplorerProvider);
  context.subscriptions.push(statusBarItem);
}

export function deactivate() {}
