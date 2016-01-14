// TODO - cache ALL computed information here until entity, or
// parent entity changes.

import memoize from 'memoizee';
import BoundingRect from 'common/geom/bounding-rect';
import { DisplayEntityComputer } from 'common/entities';
import { translateStyleToIntegers } from 'common/utils/html/css/translate-style';

import {
  translateStyle,
  translateLength as translateCSSLength
} from 'common/utils/html/css';

import {
  calculateZoom,
  multiplyStyle
} from 'common/utils/html';

const CANVAS_ELEMENT_ID = 'preview-canvas';

function getElementOffset(element) {
  var p = element.parentNode;

  var left = 0;
  var top  = 0;

  while(p && p.id !== CANVAS_ELEMENT_ID) {
    left += p.offsetLeft;
    top  += p.offsetTop;
    p = p.parentNode;
  }

  return { left, top };
}

class ReactEntityComputer extends DisplayEntityComputer {

  constructor(entity, component) {
    super(entity, component);

    this.getBoundingRect = memoize(this.getBoundingRect.bind(this));
    //this.getStyle = memoize(this.getStyle.bind(this), { primitive: true });
    //this.getComputedStyle = memoize(this.getComputedStyle.bind(this));
  }

  /**
   * busts cache when the entity is updated. This gets called via
   * entity.jsx
   */

  invalidateCache() {
    this.getBoundingRect.clear();
  }

  setPositionFromAbsolutePoint(point) {

    // absolute positions are always in pixels - always round
    // to the nearest one
    var element = this.getDisplayElement();
    var offset  = getElementOffset(element);

    var bounds = this.getBoundingRect(false);
    var style  = this.getStyle(false);

    var originLeft = bounds.left - style.left;
    var originTop  = bounds.top  - style.top ;

    var left = point.left;
    var top  = point.top;

    left -= offset.left;
    top  -= offset.top;

    // offset relative position (based on children)
    if (/relative|static/.test(style.position)) {
      left -= originLeft - offset.left;
      top -= originTop - offset.top;
    }

    var newStyle = translateStyle({
      left: left,
      top: top
    }, this.entity.getStyle(), element);

    this.entity.setStyle(newStyle);
  }

  getZoom() {
    return calculateZoom(this.getDisplayElement());
  }

  getCapabilities() {

    var style = window.getComputedStyle(this.getDisplayElement());

    var movable   = style.position !== 'static';
    var resizable = /fixed|absolute/.test(style.position) || !/^inline$/.test(style.display);

    return {
      movable,
      resizable
    };
  }

  getDisplayElement() {
    return this.displayObject.refs.element;
  }

  setBoundingRect(bounds) {

    // NO zoom here - point is NOT fixed, but relative
    var absStyle = this.getStyle(false);
    var entStyle = this.entity.getStyle(false);

    var props = { ...bounds };
    for (var k in bounds) {
      if (entStyle[k] == void 0) continue;

      // TODO - want to use translateStyle here instead
      props[k] = translateCSSLength(
        absStyle[k],
        entStyle[k],
        bounds[k]
      );
    }

    var b = this.getBoundingRect(false);

    // FIXME: wrong place here - this is just a quick
    // check to see if this *actually* works
    this.setPositionFromAbsolutePoint({
      left: bounds.left,
      top : bounds.top
    });

    delete props.left;
    delete props.top;

    this.entity.setStyle(props);
  }

  toJSON() {
    return null;
  }

  /**
   * returns the computed property of the element along with all inherited styles.
   * TODO: This should be memoized -- very expensive operation
   * @returns {*}
   */

  getComputedStyle() {
    var cs   = window.getComputedStyle(this.displayObject.refs.element);
    // normalize computed styles to pixels
    return {
      position: cs.position,
      ...translateStyleToIntegers({
        marginLeft: cs.marginLeft,
        marginTop : cs.marginTop,
        marginRight: cs.marginRight,
        marginBottom: cs.marginBottom,
        paddingLeft: cs.paddingLeft,
        paddingTop: cs.paddingTop,
        paddingRight: cs.paddingRight,
        paddingBottom: cs.paddingBottom
      }, this.displayObject.refs.element)
    }
  }

  getBoundingRect(zoomProperties) {

    var refs = this.displayObject.refs;

    if (!refs.element) {
      console.error('trying to calculate display information on entity that is not mounted');
      return {
        left   : 0,
        top    : 0,
        width  : 0,
        height : 0
      };
    }

    var entity = this.entity;

    // eeeesh - this is yucky, but we *need* to offset the position
    // of the preview canvas so that we can get the correct position
    // of this element. This is the *simplest* solution I can think of.
    // TODO - this *will not work* when we start adding multiple canvases
    var pcrect = document.getElementById(CANVAS_ELEMENT_ID).getBoundingClientRect();
    var rect   = refs.element.getBoundingClientRect();
    var cs     = this.getComputedStyle();

    // margins are also considered bounds - add them here. Fixes a few issues
    // when selecting multiple items with different items & dragging them around.
    var left   = rect.left   - pcrect.left - cs.marginLeft;
    var top    = rect.top    - pcrect.top  - cs.marginTop;
    var right  = rect.right  - pcrect.left + cs.marginRight;
    var bottom = rect.bottom - pcrect.top  + cs.marginBottom;

    var width = right - left;
    var height = bottom - top;

    if (zoomProperties) {
      var {left, top, width, height } = multiplyStyle({ left, top, width, height }, this.getZoom());
    }

    right = left + width;
    bottom = top + height;

    return BoundingRect.create({
      left   : left,
      top    : top,
      right  : right,
      bottom : bottom
    });
  }

  getStyle(zoomProperties) {

    var refs = this.displayObject.refs;

    var entity = this.entity;

    var style = entity.getStyle();

    var { left, top } = translateStyleToIntegers({
      left: style.left || 0,
      top : style.top || 0
    }, refs.element);

    var cs   = window.getComputedStyle(refs.element);

    // normalize computed styles to pixels
    var cStyle = this.getComputedStyle();

    // zooming happens a bit further down
    var rect = this.getBoundingRect(false);
    var w = rect.right  - rect.left;
    var h = rect.bottom - rect.top;

    var style = {
      ...cStyle,
      left      : left,
      top       : top,
      width     : w,
      height    : h,

      // for rect consistency
      right     : left + w,
      bottom    : top  + h
    };

    // this normalizes the properties so that the calculated values
    // are also based on the zoom level. Important for overlay data such as
    // tools and information describing the target entity
    if (zoomProperties) {
      style = multiplyStyle(style, this.getZoom());
    }

    return style;
  }
}

export default ReactEntityComputer;
