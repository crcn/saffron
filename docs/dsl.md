template example:

```html

<!-- can import components that affect global state such as styles -->
<import src="./global.pc" />

<!-- importing a component. ID is assigned to the import tag, but using
it instantiates a new component instance -->
<import id="custom-button" src="./path/to/custom-button.pc" />

<!-- JSON files can also be imported as context -->
<import id="theme" src="./path/to/theme.json" />

<!-- import JSON files without ID to add them to _this_ context -->
<import src="./path/to/context.json" />

<!-- controllers are higher-order-components that attach functionality to components -->
<logic src="./my-controller.react.tsx" target="javascript" />
<logic src="./my-controller.laravel.php" target="php" />

<custom-button />

<!-- styles are scoped to this file -->
<style>
  div {

    /* styles can use block syntax */
    color: {{theme.primaryColor}};
  }

  /* global explicit via :global(*) */
  :global(*) {
    box-sizing: content-box;
  }
</style>

<!-- dynamically binding to attributes -->
<div style={{style}}>
  this is a component example

  <!-- slot example -->
  {{content}}
</div>

<!-- spread prop to elements -->
<span  {{boundAttributes}}> 
</span>

<!-- logic in templates using builtin JS evaluator -->
{{#if age > 10}}
  show something
{{/else if age > 5}}
  show something else
{{/else}}
  nothing else
{{/}}

{{#repeat items as k, value}} 
  Repeat some value
{{/repeat}}

<!-- listener example -->
<span onClick={{handler}}>
</span>

<!-- -->
<span class="some class {{moreClasses}}">
</span>
```

controller (logic) example:

```javascript
import * as React from "react";
export default Template => class TemplateController extends React.Component {
  render() {
    return <Template />;
  }
}
```

Additionally, `.pc` files may have a corresponding `.[COMPONENT_NAME].tdc` (Tandem component file) which contains info to help visualize the component. Here's an example file:

```javascript
{

  // 2 previews - one for mobile & one for desktop
  "previews": [
    {
      platform: "mobile",

      // dummy data for visualizing template states
      context: {
        content: "something"
      }
    },

    {
      platform: "desktop",

      // dummy data for visualizing template states
      context: {
        content: "something"
      }
    }
  ]
}
```

#### Features

- Slots
- dynamic attributes

#### Limitations

- template

#### TODO

- Examples
  - VueJS
  - Svelte
  - Larabel
  - Ruby
  - Python
  - lambdas (see mustache)

#### DX problems

- inline JS is super helpful. E.g: https://svelte.dev/docs#if
  - especially for default values (e.g: )
- should support global CSS

#### Features

- Mini JS evaluator
- type inferencing