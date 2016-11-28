import { ICommand, inject } from "@tandem/common";
import { IMessage } from "@tandem/mesh";
import { SyntheticDOMNode, DOMNodeType, SyntheticDocument } from "@tandem/synthetic-browser";
import { Store } from "@tandem/editor/browser/models";
import { HTMLExtensionStore, MergedCSSStyleRule  } from "@tandem/html-extension/editor/browser/models";
import { HTMLExtensionStoreProvider  } from "@tandem/html-extension/editor/browser/providers";
import { StoreProvider } from "@tandem/editor/browser/providers";
import { MetadataKeys } from "@tandem/editor/browser/constants";

export class UpdateMergedRuleCommand implements ICommand {
  @inject(StoreProvider.ID)
  private _store: Store;

  @inject(HTMLExtensionStoreProvider.ID)
  private _htmlStore: HTMLExtensionStore;

  execute(message: IMessage) {
    if (this._htmlStore.mergedStyleRule) {
      this._htmlStore.mergedStyleRule.dispose();
    }
    this._htmlStore.mergedStyleRule = undefined;
    if (!this._store.workspace) return;
    const selection = this._store.workspace.selection;
    if (selection.length === 1) {
      this._htmlStore.mergedStyleRule = new MergedCSSStyleRule(selection[0]);
    }
}