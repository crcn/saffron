import "./index.scss";
import * as React from "react";
import { ReactComponentFactoryDependency } from "sf-front-end/dependencies";
import { CANVAS_SIZE } from "sf-front-end/constants";

export class GridToolComponent extends React.Component<{ zoom: number }, any> {
  render() {

    const { zoom } = this.props;

    if (zoom < 6) return null;

    const size = CANVAS_SIZE * zoom;
    const gridSize = zoom;
    const paths = [

      // horizontal
      [[0, 0], [gridSize, 0]],

      // vertical
      [[0, 0], [0, gridSize]]
    ];

    return <div className="m-grid-tool">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>

        <defs>
          <pattern id="grid" width={gridSize/size} height={gridSize/size}>
            <g stroke="#000000">
              {
                paths.map(([[sx, sy], [ex, ey]]) => {
                  return <path d={`M${sx},${sy} L${ex},${ey}`}></path>
                })
              }
            </g>
          </pattern>
        </defs>
        <rect fill="url(#grid)" width={size} height={size} />
      </svg>
    </div>
  }
}

export const dependency = new ReactComponentFactoryDependency('components/tools/pointer/grid', GridToolComponent);

