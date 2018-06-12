import * as React from "react";
import { compose, pure, withHandlers } from "recompose";
import { cssPropertyChangeCompleted, cssPropertyChanged } from "actions";
import { arraySplice } from "tandem-common";
const { BackgroundItem } = require("./backgrounds.pc");

const DEFAULT_COLOR = "rgba(200, 200, 200, 1)";

export default compose(
  pure,
  withHandlers({
    onChange: ({ value, dispatch }) => (item, index) => {
      dispatch(
        cssPropertyChanged("background", replaceBackground(value, item, index))
      );
    },
    onChangeComplete: ({ value, dispatch }) => (item, index) => {
      dispatch(
        cssPropertyChangeCompleted(
          "background",
          replaceBackground(value, item, index)
        )
      );
    },
    onPlusButtonClick: ({ dispatch, value }) => () => {
      dispatch(
        cssPropertyChangeCompleted(
          "background",
          value ? value + "," + DEFAULT_COLOR : DEFAULT_COLOR
        )
      );
    }
  }),
  Base => ({
    onChange,
    onChangeComplete,
    onPlusButtonClick,
    selectedNodes,
    dispatch
  }) => {
    const node = selectedNodes[0];
    const children = splitBackgrounds(node.style.background).map(
      (background, i) => {
        return (
          <BackgroundItem
            key={i}
            value={background}
            onChange={value => onChange(value, i)}
            onChangeComplete={value => onChangeComplete(value, i)}
          />
        );
      }
    );
    return (
      <Base
        contentProps={{ children }}
        plusButtonProps={{ onClick: onPlusButtonClick }}
      />
    );
  }
);

const splitBackgrounds = value => (value || "").match(/rgba\(.*?\)/g) || [];

// TODO - validation here
const replaceBackground = (oldValue, replacement, index) =>
  arraySplice(splitBackgrounds(oldValue), index, 1, replacement)
    .filter(v => Boolean(v.trim()))
    .join(",") || undefined;
