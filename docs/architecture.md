# Architecture Overview

Zust is designed to be a simple yet powerful layer of reactivity on top of standard HTML. Its architecture is built on a few core concepts that work together to create a modern, declarative development experience.

## Core Principles

1.  **HTML as the Source of Truth:** Zust embraces the HTML you write. Component state and behavior are defined directly within the markup, making it easy to understand what a piece of UI does just by reading the HTML.

2.  **Component-Based Scoping:** Each element with a `z-state` attribute becomes the root of a new, self-contained component. The state and methods defined in `z-state` are only available to that element and its children, preventing complex state management issues.

3.  **Reactivity through Directives:** Zust uses special HTML attributes called "directives" (e.g., `z-text`, `z-on:click`, `z-if`) to link your component's state to the DOM. These directives are the bridge between your data and what the user sees.

## The Initialization Process

Understanding how Zust starts up is key to understanding its architecture.

1.  **Instantiation:** A global `Zust` instance is created. This instance holds the registered directives and manages all components.

2.  **DOM Scan:** When `zust.start()` is called (typically on `DOMContentLoaded`), the instance scans the entire `<body>` for elements containing the `z-state` attribute.

3.  **Component Initialization:** For each `z-state` element found, Zust performs the following steps:
    a.  It parses the state object defined in the attribute.
    b.  It creates a new, isolated reactive store for that component using a deep Proxy object. This ensures that any change to the state, no matter how nested, can be tracked.
    c.  It creates a `ComponentContext` object, which holds the reactive store and other utilities.
    d.  It recursively processes all directives on the component element and its children, linking them to the component's reactive store.

## Dynamic Content

Zust is not limited to the initial page load. It uses a `MutationObserver` to watch for changes to the DOM. If new nodes are added to the document (for example, via an AJAX call or another library), Zust will automatically scan them for new `z-state` components and initialize them, making the entire system dynamic and interoperable.

## The Data Flow

The flow of data in a Zust component is unidirectional and easy to follow:

1.  **User Interaction:** A user interacts with an element, triggering a DOM event (e.g., a `click`).
2.  **Event Handler:** A `z-on` directive catches the event and executes an expression, which typically modifies the component's state (e.g., `count++`).
3.  **State Mutation:** The state change is intercepted by the component's reactive Proxy store.
4.  **Notification:** The proxy notifies the underlying reactivity engine that a specific piece of state has changed.
5.  **Effect Execution:** The reactivity engine identifies all the effects (created by directives like `z-text`, `z-bind`, etc.) that depend on that specific piece of state and re-executes them.
6.  **DOM Update:** The effect handlers update the DOM to reflect the new state.

This architecture ensures that updates are efficient and predictable. Only the parts of the DOM that absolutely need to change are touched.