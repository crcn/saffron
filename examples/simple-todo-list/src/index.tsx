import React from "react";
import ReactDOM from "react-dom";
import List from "./List";

const mount = document.createElement("div");
ReactDOM.render(<List />, mount);
document.body.appendChild(mount);
