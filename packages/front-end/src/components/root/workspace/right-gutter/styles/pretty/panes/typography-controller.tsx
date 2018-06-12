import * as React from "react";
import { memoize } from "tandem-common";
import { ButtonBarOption } from "../../../../../../inputs/button-bar/controller";
import { DropdownMenuItem } from "../../../../../../inputs/dropdown/controller";
import { compose, pure, withHandlers } from "recompose";
import { cssPropertyChangeCompleted, cssPropertyChanged } from "actions";

const FONT_FAMILIES: DropdownMenuItem[] = ["Helvetica", "Roboto"].map(
  value => ({ label: value, value })
);

const FONT_WEIGHTS: DropdownMenuItem[] = ["100", "200", "300", "400"].map(
  value => ({ label: value, value })
);

const DECORATIONS: DropdownMenuItem[] = [
  "underline",
  "overline",
  "line-through"
].map(value => ({ label: value, value }));

const ALIGNMENTS: ButtonBarOption[] = [
  {
    value: "left",
    iconSrc: require("../../../../../../../icons/text-left.svg")
  },
  {
    value: "center",
    iconSrc: require("../../../../../../../icons/text-center.svg")
  },
  {
    value: "justify",
    iconSrc: require("../../../../../../../icons/text-justify.svg")
  },
  {
    value: "right",
    iconSrc: require("../../../../../../../icons/text-right.svg")
  }
];

export default compose(
  pure,
  withHandlers({
    onPropertyChange: ({ dispatch }) => (name, value) => {
      dispatch(cssPropertyChanged(name, value));
    },
    onPropertyChangeComplete: ({ dispatch }) => (name, value) => {
      dispatch(cssPropertyChangeCompleted(name, value));
    }
  }),
  Base => ({ selectedNodes, onPropertyChange, onPropertyChangeComplete }) => {
    const node = selectedNodes[0];
    return (
      <Base
        familyInputProps={{
          options: FONT_FAMILIES,
          value: node.style["font-family"],
          onChange: propertyChangeCallback("font-family", onPropertyChange),
          onChangeComplete: propertyChangeCallback(
            "font-family",
            onPropertyChangeComplete
          )
        }}
        weightInputProps={{
          options: FONT_WEIGHTS,
          value: node.style["font-weight"],
          onChange: propertyChangeCallback("font-weight", onPropertyChange),
          onChangeComplete: propertyChangeCallback(
            "font-weight",
            onPropertyChangeComplete
          )
        }}
        decorationInputProps={{
          options: FONT_WEIGHTS,
          value: node.style["text-decoration"],
          onChange: propertyChangeCallback("text-decoration", onPropertyChange),
          onChangeComplete: propertyChangeCallback(
            "text-decoration",
            onPropertyChangeComplete
          )
        }}
        lineInputProps={{
          options: FONT_WEIGHTS,
          value: node.style["line-height"],
          onChange: propertyChangeCallback("line-height", onPropertyChange),
          onChangeComplete: propertyChangeCallback(
            "line-height",
            onPropertyChangeComplete
          )
        }}
        spacingInputProps={{
          options: FONT_WEIGHTS,
          value: node.style["letter-spacing"],
          onChange: propertyChangeCallback("letter-spacing", onPropertyChange),
          onChangeComplete: propertyChangeCallback(
            "letter-spacing",
            onPropertyChangeComplete
          )
        }}
        alignmentInputProps={{
          options: ALIGNMENTS,
          value: node.style["text-alignment"],
          onChange: propertyChangeCallback("text-alignment", onPropertyChange),
          onChangeComplete: propertyChangeCallback(
            "text-alignment",
            onPropertyChangeComplete
          )
        }}
        sizeInputProps={{
          options: FONT_FAMILIES,
          value: node.style["font-size"],
          onChange: propertyChangeCallback("font-size", onPropertyChange),
          onChangeComplete: propertyChangeCallback(
            "font-size",
            onPropertyChangeComplete
          )
        }}
        colorInputProps={{
          value: node.style.color,
          onChange: propertyChangeCallback("color", onPropertyChange),
          onChangeComplete: propertyChangeCallback(
            "color",
            onPropertyChangeComplete
          )
        }}
      />
    );
  }
);
const propertyChangeCallback = memoize((name: string, listener) => value =>
  listener(name, value)
);
