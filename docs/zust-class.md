# The `Zust` Class

The `Zust` class, found in `lib/zust.ts`, is the main entry point and controller for the framework. It is responsible for holding the configuration, managing directives, and orchestrating the initialization of components.

## Creating an Instance

Typically, you will only need one instance of the `Zust` class for your entire application.

```javascript
import { Zust } from './lib/zust';

export const zust = new Zust();
```

### `constructor(prefix: string = 'z')`

The constructor accepts an optional `prefix` string. This prefix determines what attributes Zust looks for in your HTML. The default is `'z'`, which corresponds to directives like `z-state`, `z-text`, etc.

If you wanted to use `data-` as your prefix for better HTML validation, you could initialize it like this:

```javascript
const zust = new Zust('data');
// Now Zust will look for `data-state`, `data-text`, etc.
```

## Core Methods

### `directive(name: string, handler: DirectiveHandler, priority: number = 50)`

This is the most important method for extending Zust. It allows you to register a new directive that can be used in your HTML.

-   `name`: The name of the directive (without the prefix). For example, to register `z-uppercase`, you would use the name `'uppercase'`.
-   `handler`: A function that contains the logic for the directive. See [Extending Zust](./extending-directives.md) for a full breakdown.
-   `priority`: An optional number that determines the execution order of directives on a single element. Directives with a higher priority run first. This is crucial for structural directives like `z-for` (priority 1000) and `z-if` (priority 900) that need to run before other directives on the same element.

### `start()`

This method kicks off the entire framework. It tells the instance to scan the current document for elements with a `z-state` attribute and initialize them as components.

It is typically called once the DOM is ready:

```javascript
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        zust.start();
    });
} else {
    zust.start();
}
```

## Internal Methods

While you won't often call them directly, it's useful to understand what some of the internal methods do.

-   `scanElement(root: HTMLElement)`: Scans a given element and its descendants for new components to initialize. This is used by the `start()` method on `document.body` and by the `MutationObserver` on any newly added DOM nodes.

-   `initializeComponent(element: HTMLElement)`: This is where a `z-state` element is turned into a fully reactive component. It parses the state, creates the reactive store, and then calls `processDirectives`.

-   `processDirectives(element: HTMLElement, context: ComponentContext)`: This method is the heart of the DOM-to-state connection. It finds all `z-` attributes on an element and its children, finds the corresponding registered handler, and executes it, passing it the element, the attribute's value, and the component's reactive context.