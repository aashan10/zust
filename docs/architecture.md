# Zust Architecture

This document explains the internal architecture of Zust, including its reactivity system, component lifecycle, directive processing, and parent-child communication mechanisms.

## Table of Contents

- [Overview](#overview)
- [Reactivity System](#reactivity-system)
- [Component Lifecycle](#component-lifecycle)
- [Directive Processing](#directive-processing)
- [Parent-Child Communication](#parent-child-communication)
- [Expression Evaluation](#expression-evaluation)
- [Performance Optimizations](#performance-optimizations)

## Overview

Zust's architecture is built around several key principles:

1. **Signal-Based Reactivity**: Fine-grained reactive updates using signals
2. **Component Isolation**: Each `z-state` creates an isolated reactive scope
3. **Directive System**: Modular, extensible directive processing
4. **Parent-Child Communication**: Rich communication via `$parent` and state sharing
5. **Generic Expression Evaluation**: Unified expression processing across all directives

```
┌─────────────────────────────────────────────────────────────────┐
│                           Zust Framework                        │
├─────────────────────────────────────────────────────────────────┤
│  DOM Scanner  │  Component Manager  │  Directive Processor    │
├─────────────────────────────────────────────────────────────────┤
│                    Reactivity Engine                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Signals   │  │   Effects   │  │     Store Management    │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                   Expression Evaluator                         │
│            (Generic evaluation with magic variables)            │
└─────────────────────────────────────────────────────────────────┘
```

## Reactivity System

### Signal-Based Updates

Zust uses a signal-based reactivity system where:

1. **Signals** hold reactive values
2. **Effects** subscribe to signals and run when dependencies change
3. **Stores** manage component state with automatic signal creation

```typescript
// Simplified reactivity flow
const [signal, setSignal] = createSignal(0);

createEffect(() => {
    console.log('Signal value:', signal()); // Subscribes to signal
});

setSignal(5); // Triggers effect to run
```

### Store Creation

Each component gets its own reactive store:

```typescript
// Component state becomes reactive
const [store, setStore] = createStore({ 
    count: 0,        // Becomes signal
    user: { ... },   // Nested objects become reactive
    increment() { this.count++; }  // Methods have access to reactive 'this'
});
```

### Computed Properties (Getters)

Getters automatically become computed properties:

```typescript
const [store] = createStore({
    firstName: 'John',
    lastName: 'Doe',
    
    // Automatically recomputes when firstName or lastName changes
    get fullName() {
        return `${this.firstName} ${this.lastName}`;
    }
});
```

## Component Lifecycle

### 1. Discovery Phase

The Zust instance scans the DOM for `z-state` attributes:

```typescript
class Zust {
    scanDocument() {
        const elements = document.querySelectorAll(`[${this.prefix}-state]`);
        elements.forEach(element => this.initializeComponent(element));
    }
}
```

### 2. Component Initialization

For each component:

1. **Parse State**: Convert `z-state` attribute to JavaScript object
2. **Find Parent**: Locate parent component context
3. **Create Reactive Context**: Initialize signals, effects, and store
4. **Create Evaluation Function**: Build expression evaluator with access to `$parent`
5. **Process Directives**: Initialize all directives on component and children

## Directive Processing

### Directive Registration

Directives are registered with the framework:

```typescript
class Zust {
    directive(name: string, handler: DirectiveHandler, priority: number = 50): void {
        this.directives.set(name, { handler, priority });
    }
}

// Register built-in directives
zust.directive('text', textDirective);
zust.directive('on:click', onClickDirective);
zust.directive('bind:class', bindClassDirective);
```

### Generic Directive Handler

All directives receive the same signature:

```typescript
type DirectiveHandler = (
    element: HTMLElement, 
    value: string,           // Directive expression
    context: ComponentContext // Component context with evaluate function
) => void | (() => void);    // Optional cleanup function

// Example directive
const textDirective: DirectiveHandler = (element, value, context) => {
    const { createEffect, evaluate } = context;
    
    return createEffect(() => {
        const result = evaluate(value);
        element.textContent = String(result ?? '');
    });
};
```

## Parent-Child Communication

### Context Hierarchy

Components form a hierarchy based on DOM nesting:

```html
<!-- Root Component -->
<div z-state="{ rootData: 'root' }">         <!-- Level 0 -->
    <div z-state="{ childData: 'child' }">   <!-- Level 1 -->
        <div z-state="{ grandData: 'grand' }"> <!-- Level 2 -->
            <!-- Can access parent (Level 1) via $parent -->
        </div>
    </div>
</div>
```

### Shared Reactive Context

Child components inherit parent reactive context ensuring that effects in child components run in the same reactive context, state changes in parent trigger child effects, and batching works across parent and child.

## Expression Evaluation

### Generic Evaluate Function

All directives use a unified expression evaluation system:

```typescript
const evaluate = (expression: string, additionalParams: Record<string, any> = {}) => {
    try {
        // Build parameter list: always include $store, $parent, plus additional params
        const paramNames = ['$store', '$parent', ...Object.keys(additionalParams)];
        const paramValues = [store, parentContext?.store, ...Object.values(additionalParams)];
        
        const func = new Function(...paramNames, `with($store) { return ${expression}; }`);
        return func.call(store, ...paramValues);
    } catch (error) {
        console.error(`Error evaluating expression "${expression}":`, error);
        return undefined;
    }
};
```

### Magic Variables

The evaluation context includes several magic variables:

- **`$store`**: Current component's state
- **`$parent`**: Parent component's state  
- **`$event`**: DOM event (in event handlers)
- **`$element`**: Current DOM element (in intersection observers)

## Performance Optimizations

### 1. Fine-Grained Reactivity

Only affected DOM elements update when state changes:

```html
<div z-state="{ firstName: 'John', lastName: 'Doe' }">
    <span z-text="firstName"></span>  <!-- Only updates when firstName changes -->
    <span z-text="lastName"></span>   <!-- Only updates when lastName changes -->
    <span z-text="`${firstName} ${lastName}`"></span>  <!-- Updates when either changes -->
</div>
```

### 2. Automatic Batching

Multiple state changes in the same tick are batched automatically.

### 3. Efficient List Updates

`z-key` enables efficient list reconciliation where elements are reused when possible, only changed items trigger updates, and proper ordering is maintained during reorders.

### 4. Lazy Component Initialization

Components are only initialized when their DOM elements are discovered with no upfront parsing of entire document, components can be added dynamically, and memory usage scales with active components.

## Extension Points

### Custom Directives

Create new directives by implementing the `DirectiveHandler` interface:

```typescript
const myDirective: DirectiveHandler = (element, value, context) => {
    const { evaluate, createEffect } = context;
    
    return createEffect(() => {
        const result = evaluate(value);
        // Custom logic here
    });
};

zust.directive('my-directive', myDirective);
```

This architecture provides a solid foundation for building reactive web applications while maintaining simplicity and performance.