# Zust

Zust is a minimalist, modern, and lightweight frontend framework inspired by the reactivity model of [Alpine.js](https://alpinejs.dev/) and the signal-based architecture of [Solid.js](https://www.solidjs.com/). It allows you to add reactive, declarative, component-based behavior directly to your HTML.

## Features

- **Declarative & Reactive:** Bind your component state directly to the DOM. When your data changes, the UI updates automatically.
- **Component-Based:** Define self-contained components with isolated state directly in your HTML using the `z-state` attribute.
- **Signal-Powered:** Built on a fine-grained reactivity engine that uses signals for optimal performance. Only the specific parts of the DOM that depend on your state are updated.
- **Familiar Syntax:** If you've used frameworks like Alpine.js or Vue.js, you'll feel right at home.
- **Extensible:** Easily create your own custom directives to encapsulate and reuse behavior.

## Getting Started

To get started with Zust, you simply need to include the main script. The framework will automatically scan the document and initialize all components defined with a `z-state` attribute.

Here is a simple counter component to demonstrate the core concepts:

```html
<!-- index.html -->

<div z-state="{ count: 0 }">
    <h2>My Counter</h2>
    
    <button z-on:click="count--">-</button>
    
    <span z-text="count"></span>
    
    <button z-on:click="count++">+</button>
</div>

<script type="module" src="/index.ts"></script>
```

In this example:
1.  `z-state` defines a new component with an initial state object `{ count: 0 }`.
2.  `z-text="count"` binds the `<span>`'s text content to the `count` property.
3.  `z-on:click` attaches click event listeners that modify the `count` property.

When you click the buttons, the `count` state changes, and the `<span>` updates automatically.

## Table of Contents

- [Zust](#zust)
  - [Features](#features)
  - [Getting Started](#getting-started)
  - [Table of Contents](#table-of-contents)
  - [Core Concepts](#core-concepts)
    - [Architecture](./docs/architecture.md)
    - [The Reactivity System](./docs/reactivity.md)
    - [The `Zust` Class](./docs/zust-class.md)
  - [API Reference](#api-reference)
    - [Directives](./docs/directives.md)
  - [Advanced Guides](#advanced-guides)
    - [Extending Zust](./docs/extending-directives.md)

