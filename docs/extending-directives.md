# Extending Zust: Custom Directives

One of the most powerful features of Zust is its extensibility. You are not limited to the built-in directives; you can easily create your own to encapsulate custom behaviors and DOM manipulations.

## Registering a Directive

You register a custom directive on the `Zust` instance using the `directive` method:

```javascript
import { zust } from './index';

zust.directive('my-directive', (element, value, context) => {
  // Directive logic goes here
});
```

This would allow you to use `z-my-directive` in your HTML.

## The Directive Handler

A directive is simply a function, called a `DirectiveHandler`, that receives three arguments:

`handler(element, value, context)`

-   `element`: The `HTMLElement` that the directive is placed on.
-   `value`: The string value of the directive attribute (e.g., for `z-foo="bar"`, the value is `"bar"`).
-   `context`: The component's `ComponentContext` object. This is your toolkit for creating reactive behaviors.

### The `context` Object

The context object gives your directive access to the component's reactive world:

-   `context.store`: The reactive `Proxy` for the component's state. Reading properties from this store inside an effect will create reactive dependencies.
-   `context.createEffect`: This is the most important utility. It's a function that takes a callback and immediately executes it. The engine tracks which signals are accessed inside the callback, and will automatically re-run the callback whenever one of those signals changes.
-   `context.batch`: A function to group multiple DOM changes into a single update, improving performance.
-   `context.zustInstance`: The central `Zust` instance.

## Example: A `z-log` Directive

Let's create a simple directive that logs a value to the console whenever it changes. This is a great way to debug reactive state.

```javascript
// In your main setup file (e.g., index.ts)

zust.directive('log', (element, value, { store, createEffect }) => {
  createEffect(() => {
    // Create a function to evaluate the expression from the attribute
    const func = new Function('$store', `with($store) { return ${value} }`);
    
    // Use .call() to ensure `this` is bound to the reactive store
    const result = func.call(store, store);

    console.log(`[z-log] ${value}:`, result);
  });
});
```

Now you can use it in your HTML:

```html
<div z-state="{ count: 0 }">
  <h1 z-log="count">...</h1>
  <button z-on:click="count++">Click Me</button>
</div>
```

Every time you click the button, the `count` state will change, and your `z-log` directive's effect will re-run, logging the new value to the console.

## Directive Lifecycle: Cleanup

Directives often need to clean up after themselves. For example, a directive that uses `setInterval` needs to clear that interval when the element is removed from the DOM (e.g., by a `z-if` or `z-for` directive).

To do this, simply return a function from your directive handler. This cleanup function will be automatically called when the element's scope is destroyed.

### Example: A `z-interval` Directive

Let's create a directive that calls a method every N milliseconds.

```javascript
zust.directive('interval', (element, value, { store }) => {
  // For this example, let's assume the value is a method name like 'tick'
  const intervalID = setInterval(() => {
    // Find the method on the store and run it
    if (typeof store[value] === 'function') {
      store[value]();
    }
  }, 1000);

  // Return a cleanup function
  return () => {
    clearInterval(intervalID);
    console.log('Cleared interval for', element);
  };
});
```

```html
<div z-state="{ count: 0, tick() { this.count++ } }" z-interval="tick">
  <p>I increment every second: <span z-text="count"></span></p>
</div>
```