import * as ts from "typescript";
import {
  BaseContentEditor,
  ISyntheticObject,
  MoveChildEditChange,
  RemoveChildEditChange,
  InsertChildEditChange,
  SetKeyValueEditChange,
} from "@tandem/sandbox";

import {
  DOMNodeType,
  SyntheticDOMNode,
  SyntheticDOMElement,
  SyntheticDOMElementEdit,
  SyntheticDOMContainerEdit,
} from "@tandem/synthetic-browser";

interface ITSReplacement {
  start: number;
  end: number;
  value: string;
}

export class TSEditor extends BaseContentEditor<ts.Node> {

  private _replacements: ITSReplacement[] = [];

  [SyntheticDOMContainerEdit.MOVE_CHILD_NODE_EDIT](target: ts.JsxElement, action: MoveChildEditChange) {
    const child = this.findTargetASTNode(target, action.child as SyntheticDOMNode);
    this._replacements.push({
      start: child.getStart(),
      end: child.getEnd(),
      value: ""
    });
    const beforeChild = target.children[action.newIndex];
    this._replacements.push({
      start: beforeChild.getStart(),
      end: beforeChild.getStart(),
      value: child.getText()
    });
  }

  [SyntheticDOMContainerEdit.REMOVE_CHILD_NODE_EDIT](target: ts.JsxElement, action: RemoveChildEditChange) {
    const child = this.findTargetASTNode(target, action.child as SyntheticDOMNode);
    this._replacements.push({
      start: child.getStart(),
      end: child.getEnd(),
      value: ""
    });
  }

  [SyntheticDOMContainerEdit.INSERT_CHILD_NODE_EDIT](target: ts.JsxElement | ts.JsxSelfClosingElement, action: InsertChildEditChange) {

    if (target.kind === ts.SyntaxKind.JsxSelfClosingElement) {
      const jsxElement = <ts.JsxSelfClosingElement>target;
      this._replacements.push({
        start: jsxElement.getEnd() - 2, // />,
        end: jsxElement.getEnd(),
        value: `>${action.child.toString()}</${jsxElement.tagName.getText()}>`
      });

    } else {
      const jsxElement = <ts.JsxElement>target;
      const index = action.index;
      let pos: number;

      if (jsxElement.children.length) {
        pos = jsxElement.children[index === Infinity ? jsxElement.children.length - 1 : index].getEnd();
      } else {
        pos = jsxElement.openingElement.getEnd();
      }

      this._replacements.push({
        start: pos,
        end: pos,
        value: action.child.toString()
      });
    }
  }

  [SyntheticDOMElementEdit.SET_ELEMENT_ATTRIBUTE_EDIT](target: ts.JsxElement | ts.JsxSelfClosingElement, action: SetKeyValueEditChange) {

    function alternativeName(name) {
      return {
        class: "className"
      }[name];
    }

    const modify = (target: ts.JsxOpeningElement | ts.JsxSelfClosingElement) => {

      let found;

      for (const attribute of target.attributes) {

        // TODO - need to consider spreads
        const attr = attribute as ts.JsxAttribute;
        if (attr.name.text === action.name || attr.name.text === alternativeName(action.name)) {
          found = true;

          // if the attribute value is undefined, then remove it
          if (action.newValue == null) {
            this._replacements.push({

              // remove whitespace with -1
              start: attr.getStart(),
              end: attr.getEnd(),
              value: ``
            });
          } else {
            this._replacements.push({
              start: attr.initializer.getStart(),
              end: attr.initializer.getEnd(),
              value: `"${action.newValue}"`
            });
          }
        }
      }

      if (!found) {
        this._replacements.push({
          start: target.tagName.getEnd(),
          end: target.tagName.getEnd(),
          value: ` ${action.name}="${action.newValue}"`
        });
      }
    }

    if (target.kind === ts.SyntaxKind.JsxSelfClosingElement) {
      modify(<ts.JsxSelfClosingElement>target);
    } else if (target.kind === ts.SyntaxKind.JsxElement) {
      modify((<ts.JsxElement>target).openingElement);
    }
  }

  parseContent(content: string) {
    return ts.createSourceFile(this.fileName, content, ts.ScriptTarget.ES6, true);;
  }

  findTargetASTNode(root: ts.Node, target: SyntheticDOMNode) {
    let found: ts.Node;

    const content = root.getSourceFile().getText();

    const find = (node: ts.Node)  => {

      const pos = ts.getLineAndCharacterOfPosition(root.getSourceFile(), node.getFullStart());
      const tstart = target.$source.start;

      if (target.nodeType === DOMNodeType.ELEMENT) {

        // look for the tag name Identifier
        if (node.kind === ts.SyntaxKind.Identifier && pos.line + 1 === tstart.line && pos.character - 1 === tstart.column) {
          found = node.parent;
          if (found.kind === ts.SyntaxKind.JsxOpeningElement) {
            found = found.parent;
          }
        }
      }

      if (!found) ts.forEachChild(node, find);
    };

    ts.forEachChild(root, find);

    return found;
  }

  getFormattedContent(root: ts.SourceFile) {

    let text = this.content;
    const replacements = this._replacements.sort((a, b) => {
      return a.start > b.start ? -1 : 1;
    });

    for (const { start, end, value } of replacements) {
      text = text.substr(0, start) + value + text.substr(end);
    }

    return text;
  }
}