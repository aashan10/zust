# Built-in Directives

Directives are special attributes, prefixed with `z-` by default, that tell Zust to attach a certain behavior to a DOM element. They are the primary way you will interact with the framework.

## State & Scoping

### `z-state`

This is the most important directive. It initializes a new component on an element. The value of the attribute must be a JavaScript object literal.

-   **State:** Properties in this object become the component's reactive state.
-   **Methods:** Functions in this object become the component's methods.
-   **Getters:** JavaScript `get` properties become computed properties that reactively update.

All state, methods, and getters are available to the component element and all of its children.

```html
<div z-state="{
  count: 0,
  increment() { this.count++ },
  get isEven() { return this.count % 2 === 0 }
}">
  <!-- ... -->
</div>
```

## Displaying Data

### `z-text`

Sets the `textContent` of an element to the result of a JavaScript expression.

```html
<span z-text="count"></span>
<span z-text="`The count is ${count}`"></span>
<span z-text="isEven ? 'Even' : 'Odd'"></span>
```

## Conditional Rendering

### `z-show`

Toggles the visibility of an element by changing its `display` style between `none` and its original value. The element is always present in the DOM.

```html
<div z-show="count > 5">This shows up when count is greater than 5.</div>
```

### `z-if`

Completely adds or removes an element from the DOM. For performance and correctness, `z-if` **must be used on a `<template>` tag**.

```html
<template z-if="count > 10">
  <div>This entire div is only in the DOM when count is greater than 10.</div>
</template>
```

## List Rendering

### `z-for`

Iterates over an array and creates DOM elements for each item. `z-for` **must be used on a `<template>` tag**.

The syntax is `(item, index) in items` or `item in items`.

```html
<ul>
  <template z-for="(todo, index) in todos" z-key="todo.id">
    <li>
      <span z-text="index"></span>: <span z-text="todo.text"></span>
    </li>
  </template>
</ul>
```

### `z-key`

`z-key` is a special attribute used within a `z-for` loop to give each rendered element a unique identity. This allows Zust to perform more efficient updates when the list changes (e.g., items are added, removed, or re-ordered).

It is highly recommended to provide a unique key, such as an item's `id`.

```html
<template z-for="user in users" z-key="user.id">
  <!-- ... -->
</template>
```

## Attribute Binding

### `z-bind`

Binds a JavaScript expression to an HTML attribute. The most common usage is the shorthand syntax with a colon `:`.

```html
<!-- Bind the value attribute -->
<input z-bind:value="user.name">

<!-- Bind the disabled attribute -->
<button z-bind:disabled="count === 0">Reset</button>

<!-- The shorthand is a colon -->
<a :href="user.profileUrl">Profile</a>
```

#### Class and Style Binding

`z-bind:class` and `z-bind:style` have special support for object syntax, which is very powerful for dynamic styling.

```html
<!-- Toggle a single class -->
<div z-bind:class="{ 'completed': todo.completed }"></div>

<!-- Apply styles from an object -->
<div z-bind:style="{ color: 'red', fontWeight: 'bold' }"></div>
```

## Event Handling

### `z-on`

Attaches a DOM event listener to an element. The most common usage is the shorthand syntax with an `@` symbol.

```html
<!-- Call a method on click -->
<button z-on:click="increment">+</button>

<!-- Run an expression on input -->
<input z-on:input="newTodo = $event.target.value">

<!-- The shorthand is an @ symbol -->
<form @submit.prevent="submitForm">...</form>
```

-   **`$event`**: The magic `$event` variable gives you access to the native DOM event object within your expression.
-   **Modifiers**: Zust supports event modifiers like `.prevent` (calls `event.preventDefault()`) and `.stop` (calls `event.stopPropagation()`).

## Form Input Binding

### `z-model`

Provides two-way data binding for form elements like `<input>`, `<textarea>`, and `<select>`. It automatically syncs the element's value with a property on your component state.

`z-model` automatically handles checkboxes, radio buttons, and select boxes correctly.

```html
<input type="text" z-model="user.name">

<input type="checkbox" z-model="user.notifications">

<select z-model="user.country">
  <option value="US">United States</option>
  <option value="CA">Canada</option>
</select>
```