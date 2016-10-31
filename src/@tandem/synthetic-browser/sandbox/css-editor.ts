import * as postcss from "postcss";
import * as postcssSassSyntax from "postcss-scss";
import { Action, inject, Injector, InjectorProvider, sourcePositionEquals } from "@tandem/common";
import { SyntheticCSSStyleRule, SyntheticCSSStyleRuleEdit, parseCSS } from "@tandem/synthetic-browser";
import {
  BundleDependency,
  EditAction,
  IContentEdit,
  BaseContentEdit,
  ISyntheticObject,
  BaseContentEditor,
  SetValueEditActon,
  SetKeyValueEditAction,
} from "@tandem/sandbox";

// TODO - move this to synthetic-browser
// TODO - may need to split this out into separate CSS editors. Some of this is specific
// to SASS
export class CSSEditor extends BaseContentEditor<postcss.Node> {

  @inject(InjectorProvider.ID)
  private _injector: Injector;

  [SyntheticCSSStyleRuleEdit.SET_RULE_SELECTOR](node: postcss.Rule, { target, newValue }: SetValueEditActon) {
    const source = target.source;

    // prefix here is necessary
    const prefix = this.getRuleSelectorPrefix(node);
    node.selector = (node.selector.indexOf("&") === 0 ? "&" : "") + newValue.replace(prefix, "");
  }

  [SyntheticCSSStyleRuleEdit.SET_DECLARATION](node: postcss.Rule, { target, name, newValue, newName }: SetKeyValueEditAction) {
    const source = target.source;

    const shouldAdd = node.walkDecls((decl, index) => {
      if (decl.prop === name) {
        if (newValue && newValue) {
          decl.prop = newName || name;
          decl.value = newValue;
        } else {
          node.nodes.splice(index, 1);
        }
        return false;
      }
    }) !== false;

    if (shouldAdd) {
      node.nodes.push(postcss.decl({ prop: name, value: newValue }))
    }
  }

  protected findTargetASTNode(root: postcss.Root, target: ISyntheticObject) {
    let found: postcss.Node;
    root.walk((node: postcss.Node, index: number) => {

      // find the starting point for the node
      if (node.type === target.source.kind && sourcePositionEquals(node.source.start, target.source.start)) {

        // next find the actual node that the synthetic matches with -- the source position may not be
        // entirely accurate for cases such as nested selectors.
        found = this.findNestedASTNode(<any>node, target);
        return false;
      }
    });
    return found;
  }

  private findNestedASTNode(node: postcss.Container, target: ISyntheticObject): postcss.Node {
    if (isRuleNode(node)) {
      return this.findMatchingRuleNode(<postcss.Rule>node, <SyntheticCSSStyleRule>target);
    } else {
      return node;
    }
  }

  /**
   *
   *
   * @private
   * @param {postcss.Rule} node
   * @param {SyntheticCSSStyleRule} synthetic
   * @param {string} [prefix='']
   * @returns {postcss.Rule}
   */

  private findMatchingRuleNode(node: postcss.Rule, synthetic: SyntheticCSSStyleRule, prefix = ''): postcss.Rule {
    let found: postcss.Rule;
    const selector = prefix + node.selector.replace(/^\&/, "");
    if (selector === synthetic.selector) return node;
    node.each((child) => {
      if (isRuleNode(child) && (found = this.findMatchingRuleNode(<postcss.Rule>child, synthetic, selector))) {
        return false;
      }
    });

    return found;
  }

  /**
   * for nested selectors
   *
   * @private
   * @param {postcss.Rule} node
   * @returns
   */

  private getRuleSelectorPrefix(node: postcss.Rule){
    let prefix = "";
    let current = node;
    while(current = <postcss.Rule>current.parent) {
      if (!isRuleNode(current)) break;
      prefix = current.selector.replace(/^&/, "") + prefix;
    }
    return prefix;
  }

  parseContent(content: string) {

    // TODO - find syntax based on mime type here
    return parseCSS(content, undefined, postcssSassSyntax);
  }

  getFormattedContent(root: postcss.Rule) {
    return root.toString();
  }
}

function isRuleNode(node: postcss.Node) {
  return node.type === "rule";
}