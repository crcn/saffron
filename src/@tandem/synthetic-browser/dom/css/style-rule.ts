import { Dependency } from "@tandem/sandbox";
import { SyntheticDOMElement, getSelectorTester } from "@tandem/synthetic-browser";
import { SyntheticCSSObject, SyntheticCSSObjectSerializer, SyntheticCSSObjectEdit } from "./base";
import { BaseContentEdit, EditChange, SetKeyValueEditChange, SetValueEditActon } from "@tandem/sandbox";
import { ISerializedSyntheticCSSStyleDeclaration, SyntheticCSSStyleDeclaration, isValidCSSDeclarationProperty } from "./declaration";
import { Action, serializable, serialize, deserialize, ISerializer, ISerializedContent, diffArray, ITreeWalker, ArrayDiff } from "@tandem/common";

export interface ISerializedSyntheticCSSStyleRule {
  selector: string;
  style: ISerializedContent<ISerializedSyntheticCSSStyleDeclaration>
}

class SyntheticCSSStyleRuleSerializer implements ISerializer<SyntheticCSSStyleRule, ISerializedSyntheticCSSStyleRule> {
  serialize(value: SyntheticCSSStyleRule): ISerializedSyntheticCSSStyleRule {
    return {
      selector: value.selector,
      style: serialize(value.style)
    };
  }
  deserialize(value: ISerializedSyntheticCSSStyleRule, injector): SyntheticCSSStyleRule {
    return new SyntheticCSSStyleRule(value.selector, deserialize(value.style, injector));
  }
}

// TODO - move this to synthetic-browser
export class SyntheticCSSStyleRuleEdit extends SyntheticCSSObjectEdit<SyntheticCSSStyleRule> {

  static readonly SET_DECLARATION = "setDeclaration";
  static readonly SET_RULE_SELECTOR = "setRuleSelector";

  setSelector(selector: string) {
    return this.addChange(new SetValueEditActon(SyntheticCSSStyleRuleEdit.SET_DECLARATION, this.target, selector));
  }

  setDeclaration(name: string, value: string, oldName?: string, index?: number) {
    return this.addChange(new SetKeyValueEditChange(SyntheticCSSStyleRuleEdit.SET_DECLARATION, this.target, name, value, oldName, index));
  }

  addDiff(newRule: SyntheticCSSStyleRule) {
    super.addDiff(newRule);

    if (this.target.selector !== newRule.selector) {
      this.setSelector(newRule.selector);
    }

    const oldKeys = Object.keys(this.target.style).filter(isValidCSSDeclarationProperty as any);
    const newKeys = Object.keys(newRule.style).filter(isValidCSSDeclarationProperty as any);

    diffArray(oldKeys, newKeys, (a, b) => {
      return a === b ? 0 : -1;
    }).accept({
      visitInsert: ({ value, index }) => {
        this.setDeclaration(value, newRule.style[value], undefined, index);
      },
      visitRemove: ({ index }) => {

        // don't apply a move edit if the value doesn't exist.
        if (this.target.style[oldKeys[index]]) {
          this.setDeclaration(oldKeys[index], undefined);
        }
      },
      visitUpdate: ({ originalOldIndex, newValue, newIndex }) => {
        if (this.target.style[newValue] !== newRule.style[newValue]) {
          this.setDeclaration(newValue, newRule.style[newValue], undefined, newIndex);
        }
      }
    });

    return this;
  }
}

@serializable(new SyntheticCSSObjectSerializer(new SyntheticCSSStyleRuleSerializer()))
export class SyntheticCSSStyleRule extends SyntheticCSSObject {

  constructor(public selector: string, public style: SyntheticCSSStyleDeclaration) {
    super();
    if (style) {
      style.$parentRule = this;
    }
  }

  createEdit() {
    return new SyntheticCSSStyleRuleEdit(this);
  }

  toString() {
    return this.cssText;
  }

  get cssText() {
    return `${this.selector} {\n${this.style.cssText}}\n`;
  }

  applyEditChange(action: EditChange) {
    if (action.type === SyntheticCSSObjectEdit.SET_SYNTHETIC_SOURCE_EDIT) {
      (<SetKeyValueEditChange>action).applyTo(this);
    } else if (action.type === SyntheticCSSStyleRuleEdit.SET_DECLARATION) {
      const { name, newValue, oldName } = <SetKeyValueEditChange>action;
      this.style.setProperty(name, newValue, undefined, oldName);
    } else {
      console.error(`Cannot apply ${action.type}`);
    }
  }

  cloneShallow(deep?: boolean) {
    return new SyntheticCSSStyleRule(this.selector, undefined);
  }

  matchesElement(element: SyntheticDOMElement) {
    return getSelectorTester(this.selector).test(element);
  }

  countShallowDiffs(target: SyntheticCSSStyleRule): number {
    return this.selector === target.selector ? 0 : -1;
  }

  visitWalker(walker: ITreeWalker) {
    walker.accept(this.style);
  }
}