# The Reactivity System

At the heart of Zust is a powerful, fine-grained reactivity system built from scratch using principles from modern frameworks like Solid.js. This system is what allows the UI to update automatically when your state changes. It is implemented in `lib/reactivity.ts`.

## Core Primitives

The engine is built on two fundamental concepts: **Signals** and **Effects**.

### Signals: The Source of Truth

A signal is the most basic unit of reactivity. It is an object that holds a single value and contains a list of subscribers (effects) that depend on that value. You can think of it as a single cell in a spreadsheet.

- **Getter:** When you read a signal's value, you are calling its getter. The getter does two things: it returns the current value and, if it's being called from within an effect, it subscribes that effect to future updates.
- **Setter:** When you change a signal's value, you are calling its setter. The setter updates the internal value and then notifies all of its subscribers, telling them to re-run.

In Zust, you don't typically interact with signals directly. They are used internally by the `createStore` function.

### Effects: The Reaction

An effect is a function that is automatically re-executed whenever one of its dependencies (a signal) changes. Directives like `z-text` and `z-show` create effects under the hood.

```javascript
// Simplified example of how z-text works

// z-text="count"
createEffect(() => {
    element.textContent = store.count;
});
```

When this effect first runs, it accesses `store.count`. The signal for `count` sees that it's being accessed inside an effect and adds the effect to its list of subscribers. From now on, whenever the `count` signal is updated, this effect will automatically re-run, updating the element's `textContent`.

This automatic dependency tracking is the magic of the system. You never have to manually specify which effects should run; you simply access the data you need, and the system builds the dependency graph for you.

## The Reactive Store

While signals and effects are the low-level primitives, you primarily interact with the reactivity system through the component's state object, which is a deep, reactive `Proxy`.

### `createStore(initialState)`

When a component is initialized, its state object is passed to the `createStore` function. This function returns a `Proxy` that wraps your state.

This proxy intercepts all interactions with your state object:

-   **Getting a Property (`get` trap):** When you read a property (e.g., `store.count`), the proxy trap fires. It gets the corresponding signal for that property path (e.g., `'count'`) and calls its getter, creating a subscription if you are inside an effect. It then returns the value.

-   **Setting a Property (`set` trap):** When you write to a property (e.g., `store.count++`), the proxy trap fires. It updates the raw state object and then calls the setter for the corresponding signal (`'count'`). This triggers all subscribed effects to re-run.

### Deep Reactivity

The store is deeply reactive. This means that changes to nested objects and arrays are also tracked.

```javascript
store.user.name = 'Alice'; // This is reactive
store.todos[0].completed = true; // This is also reactive
```

When a nested property like `todos[0].completed` is changed, the `set` trap is smart enough to notify not only the signal for that specific property (`'todos.0.completed'`) but also the signals for its parents (`'todos.0'` and `'todos'`). This ensures that effects that depend on the entire array (like a getter that uses `todos.filter(...)`) are correctly re-evaluated.

### Batching

To ensure performance, Zust automatically batches multiple state changes that occur in the same tick. If you change three different state properties in a single event handler, dependents will only re-run once after all changes have been made, preventing unnecessary layout calculations.