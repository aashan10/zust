# Zust

Zust is a minimalist, modern, and lightweight frontend framework that brings reactive, declarative behavior directly to your HTML. Inspired by Alpine.js's simplicity and Solid.js's reactivity, Zust provides a powerful yet approachable way to build interactive web applications.

## ✨ Key Features

- **🎯 Declarative & Reactive** - Bind component state directly to the DOM with automatic updates
- **🧩 Component-Based** - Self-contained components with isolated state using `z-state`
- **⚡ Signal-Powered** - Fine-grained reactivity engine for optimal performance
- **👨‍👩‍👧 Parent-Child Communication** - Rich communication between nested components via `$parent`
- **🔗 Reactive State Sharing** - True state reference sharing with automatic synchronization
- **👁️ Intersection Observer** - Built-in scroll and visibility detection directives
- **🚀 Zero Build Step** - Drop-in solution that works directly in the browser
- **🔧 Extensible** - Create custom directives to encapsulate reusable behavior

## 🚀 Quick Start

### Option 1: NPM Installation

```bash
npm install zust
```

```html
<!DOCTYPE html>
<html>
<body>
    <div z-state="{ count: 0 }">
        <h1>Counter: <span z-text="count"></span></h1>
        <button z-on:click="count++">+</button>
    </div>

    <script type="module">
        import zust from 'zust';
        zust.start();
    </script>
</body>
</html>
```

### Option 2: CDN (No Build Step)

```html
<!DOCTYPE html>
<html>
<body>
    <div z-state="{ count: 0 }">
        <h1>Counter: <span z-text="count"></span></h1>
        <button z-on:click="count++">+</button>
    </div>

    <!-- Zust auto-starts when loaded via CDN -->
    <script src="https://unpkg.com/@zust/zust@latest/dist/index.esm.min.js"></script>
</body>
</html>
```

**CDN Options:**
- **unpkg**: `https://unpkg.com/@zust/zust@latest/dist/index.esm.min.js`
- **jsDelivr**: `https://cdn.jsdelivr.net/npm/@zust/zust@latest/dist/index.esm.min.js`

## 📖 Core Concepts

### Components with `z-state`

Every Zust component starts with `z-state`, which defines the component's reactive state:

```html
<div z-state="{
    user: { name: 'Alice', age: 30 },
    isEditing: false,
    save() { 
        this.isEditing = false;
        console.log('Saved:', this.user);
    },
    get displayName() {
        return `${this.user.name} (${this.user.age})`
    }
}">
    <h3 z-text="displayName"></h3>
    <button z-on:click="isEditing = !isEditing" z-text="isEditing ? 'Cancel' : 'Edit'"></button>
    
    <div z-show="isEditing">
        <input z-model="user.name" placeholder="Name">
        <input z-model="user.age" type="number" placeholder="Age">
        <button z-on:click="save()">Save</button>
    </div>
</div>
```

### Reactivity

Zust uses a signal-based reactivity system. When you modify state, only the specific DOM elements that depend on that state are updated:

```html
<div z-state="{ 
    firstName: 'John', 
    lastName: 'Doe',
    get fullName() { return `${this.firstName} ${this.lastName}` }
}">
    <!-- Only updates when firstName changes -->
    <input z-model="firstName">
    
    <!-- Only updates when lastName changes -->
    <input z-model="lastName">
    
    <!-- Updates when either firstName or lastName changes -->
    <h1 z-text="fullName"></h1>
</div>
```

## 👨‍👩‍👧 Parent-Child Communication

### Accessing Parent State

Child components can read and modify parent state using `$parent`:

```html
<!-- Parent Component -->
<div z-state="{ 
    theme: 'light', 
    user: { name: 'Alice', role: 'admin' }
}">
    <h1>Theme: <span z-text="theme"></span></h1>
    
    <!-- Child Component -->
    <div z-state="{ 
        localSetting: 'child-value',
        toggleTheme() {
            $parent.theme = $parent.theme === 'light' ? 'dark' : 'light';
        }
    }">
        <p>Parent theme from child: <span z-text="$parent.theme"></span></p>
        <p>Parent user: <span z-text="$parent.user.name"></span></p>
        <button z-on:click="toggleTheme()">Toggle Parent Theme</button>
        <button z-on:click="$parent.user.name = 'Bob'">Change Parent User</button>
    </div>
</div>
```

### Reactive State Sharing

For true state synchronization, child components can share references to parent state:

```html
<!-- Parent Component -->
<div z-state="{ 
    counter: 0, 
    increment() { this.counter++; } 
}">
    <h2>Parent Counter: <span z-text="counter"></span></h2>
    <button z-on:click="increment()">Parent +1</button>
    
    <!-- Child Component with Shared State Reference -->
    <div z-state="{ 
        counter: $parent.counter,  // Creates reactive reference, not copy
        addFive() { this.counter += 5; }  // Modifies parent counter directly
    }">
        <h3>Child Counter: <span z-text="counter"></span></h3>
        <button z-on:click="addFive()">Child +5</button>
        <button z-on:click="counter = 0">Reset (affects parent)</button>
        
        <p><small>Both counters are always synchronized!</small></p>
    </div>
</div>
```

### Nested Communication

Communication works across multiple levels of nesting:

```html
<div z-state="{ message: '', setMessage(text) { this.message = text; } }">
    <p>Message: <span z-text="message"></span></p>
    
    <div z-state="{ childValue: 'from child' }">
        <div z-state="{ grandchildValue: 'from grandchild' }">
            <!-- Grandchild can access parent (skipping child) -->
            <button z-on:click="$parent.setMessage('Hello from grandchild!')">
                Send to Root
            </button>
        </div>
    </div>
</div>
```

## 📚 Directives Reference

### Data Display

#### `z-text`
Sets the text content of an element:

```html
<span z-text="user.name"></span>
<h1 z-text="`Hello, ${user.name}!`"></h1>
<p z-text="count > 10 ? 'High' : 'Low'"></p>
```

### Attribute Binding

#### `z-bind`
Binds JavaScript expressions to HTML attributes:

```html
<!-- Basic binding -->
<input z-bind:value="user.name">
<img z-bind:src="user.avatar" z-bind:alt="user.name">
<button z-bind:disabled="!isValid">Submit</button>

<!-- Class binding with objects -->
<div z-bind:class="{ 
    'active': isActive, 
    'disabled': !isEnabled,
    'large': size === 'lg' 
}"></div>

<!-- Style binding with objects -->
<div z-bind:style="{ 
    color: theme.textColor, 
    backgroundColor: theme.bgColor,
    fontSize: `${fontSize}px`
}"></div>
```

### Event Handling

#### `z-on`
Attaches event listeners to elements:

```html
<!-- Method calls -->
<button z-on:click="increment()">Click me</button>

<!-- Inline expressions -->
<button z-on:click="count++">Increment</button>

<!-- Event object access -->
<input z-on:input="handleInput($event)">
<form z-on:submit="submitForm($event)">

<!-- Multiple events -->
<div z-on:mouseenter="isHovered = true" z-on:mouseleave="isHovered = false">
    Hover me
</div>
```

### Form Binding

#### `z-model`
Creates two-way data binding for form elements:

```html
<div z-state="{ 
    form: { 
        name: '', 
        email: '', 
        isSubscribed: false, 
        country: 'us' 
    } 
}">
    <!-- Text inputs -->
    <input z-model="form.name" placeholder="Name">
    <input z-model="form.email" type="email" placeholder="Email">
    
    <!-- Checkbox -->
    <label>
        <input type="checkbox" z-model="form.isSubscribed">
        Subscribe to newsletter
    </label>
    
    <!-- Select -->
    <select z-model="form.country">
        <option value="us">United States</option>
        <option value="ca">Canada</option>
        <option value="uk">United Kingdom</option>
    </select>
    
    <!-- Display form data -->
    <pre z-text="JSON.stringify(form, null, 2)"></pre>
</div>
```

### Conditional Rendering

#### `z-show`
Controls element visibility (element stays in DOM):

```html
<div z-show="isVisible">This toggles visibility</div>
<p z-show="user.role === 'admin'">Admin only content</p>
<button z-show="!isLoading && isValid">Submit</button>
```

#### `z-if` (on `<template>`)
Conditionally adds/removes elements from DOM:

```html
<template z-if="user.isLoggedIn">
    <div>Welcome back!</div>
</template>

<template z-if="items.length === 0">
    <p>No items found</p>
</template>
```

### List Rendering

#### `z-for` (on `<template>`)
Renders lists of elements:

```html
<!-- Basic iteration -->
<ul>
    <template z-for="item in items" z-key="item.id">
        <li z-text="item.name"></li>
    </template>
</ul>

<!-- With index -->
<ol>
    <template z-for="(todo, index) in todos" z-key="todo.id">
        <li>
            <span z-text="index + 1"></span>. 
            <span z-text="todo.title"></span>
        </li>
    </template>
</ol>

<!-- Complex example -->
<div z-state="{ 
    users: [
        { id: 1, name: 'Alice', role: 'admin' },
        { id: 2, name: 'Bob', role: 'user' }
    ]
}">
    <template z-for="user in users" z-key="user.id">
        <div z-bind:class="{ admin: user.role === 'admin' }">
            <h3 z-text="user.name"></h3>
            <span z-text="user.role"></span>
            <button z-on:click="user.role = 'admin'">Make Admin</button>
        </div>
    </template>
</div>
```

### Intersection Observer

#### `z-intersect:visible` / `z-intersect:invisible`
Trigger actions when elements enter or leave the viewport:

```html
<div z-state="{ 
    visibleCount: 0, 
    invisibleCount: 0,
    loadMore() { /* load more content */ }
}">
    <!-- Trigger when element becomes visible -->
    <div z-intersect:visible="visibleCount++; console.log('Element visible!')">
        Scroll to see me!
    </div>
    
    <!-- Infinite scroll -->
    <div z-intersect:visible="loadMore()">
        Loading more...
    </div>
    
    <!-- Track when element leaves viewport -->
    <div z-intersect:invisible="invisibleCount++">
        Track when I disappear
    </div>
    
    <p>Visible triggers: <span z-text="visibleCount"></span></p>
    <p>Invisible triggers: <span z-text="invisibleCount"></span></p>
</div>
```

## 🔧 Advanced Usage

### Custom Methods and Computed Properties

```html
<div z-state="{
    items: ['apple', 'banana', 'cherry'],
    filter: '',
    
    // Computed property
    get filteredItems() {
        return this.items.filter(item => 
            item.toLowerCase().includes(this.filter.toLowerCase())
        );
    },
    
    // Custom methods
    addItem(item) {
        this.items.push(item);
    },
    
    removeItem(index) {
        this.items.splice(index, 1);
    }
}">
    <input z-model="filter" placeholder="Filter items...">
    
    <ul>
        <template z-for="(item, index) in filteredItems" z-key="index">
            <li>
                <span z-text="item"></span>
                <button z-on:click="removeItem(index)">Remove</button>
            </li>
        </template>
    </ul>
    
    <button z-on:click="addItem('new item')">Add Item</button>
</div>
```

### Complex State Management

```html
<div z-state="{
    app: {
        user: { name: '', email: '' },
        settings: { theme: 'light', notifications: true },
        ui: { loading: false, error: null }
    },
    
    async saveUser() {
        this.app.ui.loading = true;
        this.app.ui.error = null;
        
        try {
            const response = await fetch('/api/user', {
                method: 'POST',
                body: JSON.stringify(this.app.user),
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) throw new Error('Save failed');
            
            console.log('User saved successfully');
        } catch (error) {
            this.app.ui.error = error.message;
        } finally {
            this.app.ui.loading = false;
        }
    }
}">
    <form z-on:submit.prevent="saveUser()">
        <input z-model="app.user.name" placeholder="Name" required>
        <input z-model="app.user.email" type="email" placeholder="Email" required>
        
        <button type="submit" z-bind:disabled="app.ui.loading">
            <span z-show="!app.ui.loading">Save User</span>
            <span z-show="app.ui.loading">Saving...</span>
        </button>
    </form>
    
    <div z-show="app.ui.error" style="color: red;">
        Error: <span z-text="app.ui.error"></span>
    </div>
</div>
```

## 🎯 Best Practices

### Component Organization

```html
<!-- ✅ Good: Self-contained components -->
<div z-state="{ 
    // Keep related state together
    user: { name: '', email: '', avatar: '' },
    editing: false,
    
    // Clear method names
    startEditing() { this.editing = true; },
    cancelEditing() { this.editing = false; },
    saveUser() { /* save logic */ }
}">
    <!-- Component content -->
</div>

<!-- ❌ Avoid: Scattered state -->
<div z-state="{ name: '', editing: false }">
    <div z-state="{ email: '' }">
        <!-- email should be with name -->
    </div>
</div>
```

### Performance Tips

```html
<!-- ✅ Good: Use z-key for efficient list updates -->
<template z-for="item in items" z-key="item.id">
    <div z-text="item.name"></div>
</template>

<!-- ✅ Good: Use z-show for frequent toggles -->
<div z-show="isVisible">Frequently toggled content</div>

<!-- ✅ Good: Use z-if for expensive content -->
<template z-if="shouldRenderChart">
    <expensive-chart-component></expensive-chart-component>
</template>
```

### State Sharing Patterns

```html
<!-- ✅ Good: Share references for automatic sync -->
<div z-state="{ sharedCounter: 0 }">
    <div z-state="{ counter: $parent.sharedCounter }">
        <!-- Always in sync with parent -->
    </div>
</div>

<!-- ✅ Good: Use methods for complex parent communication -->
<div z-state="{ 
    notifications: [],
    addNotification(message) { this.notifications.push(message); }
}">
    <div z-state="{ 
        sendMessage() {
            $parent.addNotification('Message sent!');
        }
    }">
        <button z-on:click="sendMessage()">Send</button>
    </div>
</div>
```

## 🔍 Magic Variables

Zust provides several magic variables accessible in expressions:

- **`$store`** - The current component's state object
- **`$parent`** - The parent component's state object
- **`$event`** - The DOM event object (in event handlers)
- **`$element`** - The current DOM element (in intersection observers)

## 📦 Build Outputs

Zust provides multiple build formats for different use cases:

- **ESM (ES Modules)**: `dist/index.mjs` - For modern bundlers and `import` statements
- **CommonJS**: `dist/index.js` - For Node.js and `require()` 
- **TypeScript**: `dist/index.d.ts` - Type definitions
- **UMD**: `dist/index.umd.js` - Universal module for CDN usage
- **UMD Minified**: `dist/index.umd.min.js` - Minified version for production CDN (13KB)

## 🚀 What Makes Zust Special

1. **Zero Build Step** - Works directly in browsers via CDN or ES modules
2. **Tiny Size** - 13KB minified, maximum functionality  
3. **Familiar Syntax** - If you know HTML and JavaScript, you know Zust
4. **True Reactivity** - Fine-grained updates with signal-based system
5. **Parent-Child Communication** - Rich component communication without complexity
6. **Progressive Enhancement** - Add reactivity to existing HTML incrementally
7. **CDN Ready** - Auto-starts when loaded via script tag

## 📄 License

MIT License - feel free to use Zust in your projects!

---

Ready to build reactive web applications with minimal complexity? Start with Zust today! 🚀
