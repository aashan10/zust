# Zust Directives Reference

Directives are special HTML attributes prefixed with `z-` that give elements reactive behavior. This comprehensive guide covers all built-in directives with examples and best practices.

## Table of Contents

- [State Management](#state-management)
- [Data Display](#data-display)
- [Attribute Binding](#attribute-binding)
- [Event Handling](#event-handling)
- [Form Input Binding](#form-input-binding)
- [Conditional Rendering](#conditional-rendering)
- [List Rendering](#list-rendering)
- [Lazy Loading](#lazy-loading)
- [Intersection Observer](#intersection-observer)
- [Parent-Child Communication](#parent-child-communication)

## State Management

### `z-state`

The foundation directive that creates a reactive component. Must contain a JavaScript object literal.

```html
<div z-state="{
    // Data properties
    count: 0,
    user: { name: 'Alice', role: 'user' },
    
    // Methods
    increment() { this.count++; },
    reset() { this.count = 0; },
    
    // Computed properties (getters)
    get isHigh() { return this.count > 10; },
    get userDisplay() { return `${this.user.name} (${this.user.role})`; }
}">
    <!-- All child elements can access this state -->
</div>
```

**Key Features:**
- Creates isolated reactive scope
- Supports data, methods, and computed properties
- State is accessible to all descendant elements
- Supports complex nested objects

## Data Display

### `z-text`

Sets the `textContent` of an element to the result of a JavaScript expression.

```html
<div z-state="{ name: 'World', count: 42 }">
    <!-- Simple property -->
    <span z-text="name"></span>
    
    <!-- Template literals -->
    <h1 z-text="`Hello, ${name}!`"></h1>
    
    <!-- Expressions -->
    <p z-text="count > 40 ? 'High' : 'Low'"></p>
    
    <!-- Method calls -->
    <span z-text="name.toUpperCase()"></span>
    
    <!-- Complex expressions -->
    <div z-text="users.filter(u => u.active).length + ' active users'"></div>
</div>
```

**Features:**
- Automatically escapes HTML (secure by default)
- Updates reactively when dependencies change
- Supports any JavaScript expression
- Converts non-strings to strings automatically

## Attribute Binding

### `z-bind`

Binds JavaScript expressions to HTML attributes.

```html
<div z-state="{ 
    imageUrl: '/user.jpg',
    isDisabled: false,
    theme: 'dark',
    styles: { color: 'red', fontSize: '18px' }
}">
    <!-- Basic attribute binding -->
    <img z-bind:src="imageUrl" z-bind:alt="user.name">
    <button z-bind:disabled="isDisabled">Click me</button>
    
    <!-- Boolean attributes -->
    <input z-bind:checked="user.isActive" type="checkbox">
    <details z-bind:open="showDetails">...</details>
    
    <!-- Data attributes -->
    <div z-bind:data-theme="theme" z-bind:data-user-id="user.id">Content</div>
    
    <!-- Links -->
    <a z-bind:href="user.profileUrl" z-bind:target="'_blank'">Profile</a>
</div>
```

#### Class Binding

`z-bind:class` supports both string and object syntax for dynamic classes:

```html
<div z-state="{ 
    isActive: true, 
    hasError: false, 
    userRole: 'admin',
    priority: 'high'
}">
    <!-- String expression -->
    <div z-bind:class="`user-${userRole} priority-${priority}`"></div>
    
    <!-- Object syntax (recommended) -->
    <div z-bind:class="{ 
        'is-active': isActive,
        'has-error': hasError,
        'is-admin': userRole === 'admin',
        'priority-high': priority === 'high'
    }"></div>
    
    <!-- Mixed approach -->
    <div class="base-class" z-bind:class="{ 
        'dynamic-class': someCondition 
    }"></div>
</div>
```

#### Style Binding

`z-bind:style` supports object syntax for dynamic styles:

```html
<div z-state="{ 
    color: '#3b82f6', 
    size: 16, 
    isVisible: true,
    position: { x: 100, y: 50 }
}">
    <!-- Object syntax -->
    <div z-bind:style="{ 
        color: color,
        fontSize: size + 'px',
        display: isVisible ? 'block' : 'none',
        transform: `translate(${position.x}px, ${position.y}px)`
    }"></div>
    
    <!-- CSS custom properties -->
    <div z-bind:style="{ 
        '--primary-color': color,
        '--font-size': size + 'px'
    }"></div>
</div>
```

## Event Handling

### `z-on`

Attaches DOM event listeners to elements.

```html
<div z-state="{ 
    count: 0, 
    message: '',
    items: [],
    
    increment() { this.count++; },
    handleSubmit(event) {
        event.preventDefault();
        console.log('Form submitted:', this.message);
    },
    addItem(text) {
        this.items.push({ id: Date.now(), text });
    }
}">
    <!-- Method calls -->
    <button z-on:click="increment()">Increment</button>
    
    <!-- Inline expressions -->
    <button z-on:click="count = 0">Reset</button>
    
    <!-- Event object access -->
    <input z-on:input="message = $event.target.value">
    <form z-on:submit="handleSubmit($event)">
        <input z-bind:value="message">
        <button type="submit">Submit</button>
    </form>
    
    
    <!-- Multiple events -->
    <div z-on:mouseenter="isHovered = true" 
         z-on:mouseleave="isHovered = false"
         z-on:click="wasClicked = true">
        Hover and click me
    </div>
    
    <!-- Keyboard events -->
    <input z-on:keydown="handleKeydown($event)"
           z-on:keyup="handleKeyup($event)">
</div>
```

#### Handling Event Details

You can access event details through the `$event` parameter:

```html
<form z-on:submit="handleSubmit($event)">
    <input type="text" z-on:input="message = $event.target.value">
    <button type="submit">Submit</button>
</form>

<div z-on:click="handleClick($event)">
    <button z-on:click="handleButtonClick($event)">
        Click me
    </button>
</div>

<input z-on:keyup="handleKeyUp($event)">
```

## Form Input Binding

### `z-model`

Creates two-way data binding for form elements. Automatically handles different input types.

```html
<div z-state="{ 
    form: {
        name: '',
        email: '',
        age: 25,
        bio: '',
        isSubscribed: false,
        gender: '',
        country: 'us',
        skills: [],
        rating: 5
    }
}">
    <!-- Text inputs -->
    <input z-model="form.name" type="text" placeholder="Name">
    <input z-model="form.email" type="email" placeholder="Email">
    <input z-model="form.age" type="number" min="0" max="120">
    
    <!-- Textarea -->
    <textarea z-model="form.bio" placeholder="Bio"></textarea>
    
    <!-- Checkbox -->
    <label>
        <input z-model="form.isSubscribed" type="checkbox">
        Subscribe to newsletter
    </label>
    
    <!-- Radio buttons -->
    <label><input z-model="form.gender" type="radio" value="male"> Male</label>
    <label><input z-model="form.gender" type="radio" value="female"> Female</label>
    <label><input z-model="form.gender" type="radio" value="other"> Other</label>
    
    <!-- Select -->
    <select z-model="form.country">
        <option value="us">United States</option>
        <option value="ca">Canada</option>
        <option value="uk">United Kingdom</option>
    </select>
    
    <!-- Multiple select -->
    <select z-model="form.skills" multiple>
        <option value="js">JavaScript</option>
        <option value="css">CSS</option>
        <option value="html">HTML</option>
    </select>
    
    <!-- Range -->
    <input z-model="form.rating" type="range" min="1" max="10">
    
    <!-- Display form data -->
    <pre z-text="JSON.stringify(form, null, 2)"></pre>
</div>
```

**Features:**
- Automatically detects input type
- Handles checkboxes, radio buttons, selects
- Works with custom form elements
- Validates and transforms values appropriately

## Conditional Rendering

### `z-show`

Controls element visibility by toggling the `display` CSS property. Element remains in DOM.

```html
<div z-state="{ 
    isVisible: true, 
    user: { role: 'admin' },
    count: 5,
    loading: false
}">
    <!-- Simple boolean -->
    <div z-show="isVisible">This can be toggled</div>
    
    <!-- Expressions -->
    <p z-show="count > 3">Count is greater than 3</p>
    <div z-show="user.role === 'admin'">Admin only content</div>
    
    <!-- Complex conditions -->
    <button z-show="!loading && user.role === 'admin'">
        Admin Action
    </button>
    
    <!-- Computed property -->
    <div z-show="canEdit">Editable content</div>
</div>
```

### `z-if`

Conditionally adds/removes elements from the DOM completely. **Must be used on `<template>` tags**.

```html
<div z-state="{ 
    user: { isLoggedIn: false, role: 'user' },
    items: [],
    showChart: false
}">
    <!-- Basic conditional rendering -->
    <template z-if="user.isLoggedIn">
        <div class="user-dashboard">
            <h2>Welcome back!</h2>
            <!-- Expensive components only render when needed -->
        </div>
    </template>
    
    <!-- Conditional sections -->
    <template z-if="user.role === 'admin'">
        <section class="admin-panel">
            <h3>Admin Panel</h3>
            <button>Manage Users</button>
        </section>
    </template>
    
    <!-- Empty states -->
    <template z-if="items.length === 0">
        <div class="empty-state">
            <p>No items found</p>
            <button z-on:click="loadItems()">Load Items</button>
        </div>
    </template>
    
    <!-- Heavy components -->
    <template z-if="showChart">
        <div class="chart-container">
            <!-- Complex chart component -->
        </div>
    </template>
</div>
```

**When to use `z-if` vs `z-show`:**
- **`z-show`**: Frequent toggles, lightweight content
- **`z-if`**: Expensive components, rare toggles, conditional sections

## List Rendering

### `z-for`

Renders lists of elements. **Must be used on `<template>` tags**.

```html
<div z-state="{
    todos: [
        { id: 1, text: 'Learn Zust', completed: false },
        { id: 2, text: 'Build app', completed: true }
    ],
    users: [
        { id: 1, name: 'Alice', role: 'admin', active: true },
        { id: 2, name: 'Bob', role: 'user', active: false }
    ]
}">
    <!-- Basic iteration -->
    <ul>
        <template z-for="todo in todos" z-key="todo.id">
            <li z-text="todo.text"></li>
        </template>
    </ul>
    
    <!-- With index -->
    <ol>
        <template z-for="(todo, index) in todos" z-key="todo.id">
            <li>
                <span z-text="index + 1"></span>. 
                <span z-text="todo.text"></span>
                <input z-model="todo.completed" type="checkbox">
            </li>
        </template>
    </ol>
    
    <!-- Complex example with nested state -->
    <template z-for="user in users" z-key="user.id">
        <div class="user-card" z-bind:class="{ inactive: !user.active }">
            <h3 z-text="user.name"></h3>
            <span z-text="user.role" z-bind:class="{ admin: user.role === 'admin' }"></span>
            
            <!-- Buttons with access to loop item -->
            <button z-on:click="user.active = !user.active">
                <span z-text="user.active ? 'Deactivate' : 'Activate'"></span>
            </button>
            
            <button z-on:click="user.role = user.role === 'admin' ? 'user' : 'admin'">
                Toggle Role
            </button>
        </div>
    </template>
</div>
```

### `z-key`

Provides unique identity for list items to optimize updates. **Highly recommended** for all `z-for` loops.

```html
<!-- ✅ Good: Use unique, stable keys -->
<template z-for="user in users" z-key="user.id">
    <div z-text="user.name"></div>
</template>

<!-- ✅ Good: Composite keys when needed -->
<template z-for="item in items" z-key="`${item.category}-${item.id}`">
    <div z-text="item.name"></div>
</template>

<!-- ❌ Avoid: Using index as key (can cause issues) -->
<template z-for="(item, index) in items" z-key="index">
    <div z-text="item.name"></div>
</template>
```

**Benefits of `z-key`:**
- Efficient list updates (add, remove, reorder)
- Preserves component state during list changes
- Prevents UI glitches and input focus loss

## Lazy Loading

### `z-lazy`

Efficiently lazy-loads content for elements with a `src` attribute, such as images, videos, and iframes. The `src` attribute is only set when the element enters the viewport, saving bandwidth and improving initial page load performance.

The directive's value should be a string expression that evaluates to the URL of the resource to load.

```html
<div z-state="{
    post: {
        heroImage: '/images/large-hero.jpg',
        promoVideo: '/videos/promo.mp4'
    }
}">
    <!-- This image will not be downloaded until it is scrolled into view -->
    <img z-lazy="post.heroImage" 
         alt="A descriptive alt text"
         class="w-full h-auto bg-gray-200">

    <!-- This video will also be lazy-loaded -->
    <video controls z-lazy="post.promoVideo" class="w-full"></video>
</div>
```

**Use Cases:**
- Lazy loading images in a gallery or blog post.
- Deferring the loading of below-the-fold videos or iframes.
- Improving performance on pages with many media assets.

**Note:** The element with `z-lazy` should have placeholder dimensions (e.g., using CSS `aspect-ratio` or width/height attributes) to prevent layout shift when the content loads.

## Intersection Observer
### `z-intersect:visible` / `z-intersect:invisible`

Triggers actions when elements enter or leave the viewport using the Intersection Observer API.

```html
<div z-state="{ 
    visibleElements: 0,
    hiddenElements: 0,
    loadMoreItems: [],
    
    loadMore() {
        // Simulate loading more content
        for (let i = 0; i < 10; i++) {
            this.loadMoreItems.push(`Item ${this.loadMoreItems.length + 1}`);
        }
    },
    
    trackView(elementId) {
        console.log(`Element ${elementId} is now visible`);
        // Analytics tracking, lazy loading, etc.
    }
}">
    <!-- Basic visibility tracking -->
    <div z-intersect:visible="visibleElements++; console.log('Element became visible')">
        Scroll to see me trigger!
    </div>
    
    <!-- Invisible tracking -->
    <div z-intersect:invisible="hiddenElements++; console.log('Element left viewport')">
        I track when you scroll past me
    </div>
    
    <!-- Infinite scroll -->
    <div class="items-container">
        <template z-for="item in loadMoreItems" z-key="item">
            <div class="item" z-text="item"></div>
        </template>
    </div>
    
    <!-- Load more trigger -->
    <div z-intersect:visible="loadMore()" class="load-trigger">
        Loading more items...
    </div>
    
    <!-- Analytics tracking -->
    <section z-intersect:visible="trackView('hero-section')" id="hero">
        <h1>Hero Section</h1>
    </section>
    
    <!-- Lazy loading images -->
    <template z-for="image in images" z-key="image.id">
        <div z-intersect:visible="image.loaded = true">
            <img z-show="image.loaded" z-bind:src="image.url">
            <div z-show="!image.loaded" class="loading-placeholder">Loading...</div>
        </div>
    </template>
    
    <!-- Stats -->
    <div class="stats">
        <p>Visible triggers: <span z-text="visibleElements"></span></p>
        <p>Hidden triggers: <span z-text="hiddenElements"></span></p>
    </div>
</div>
```

**Use Cases:**
- **Infinite scroll**: Load more content when reaching bottom
- **Lazy loading**: Load images when they enter viewport
- **Analytics**: Track which sections users view
- **Animations**: Trigger animations on scroll
- **Performance**: Initialize expensive components when needed

**Magic Variables:**
- `$element`: The DOM element being observed (available in expressions)

```html
<!-- Access the observed element -->
<div z-intersect:visible="handleVisible($element)">
    Content
</div>
```

## Parent-Child Communication

### Accessing Parent State with `$parent`

Child components can access parent state using the `$parent` magic variable.

```html
<!-- Parent Component -->
<div z-state="{ 
    appTheme: 'light',
    user: { name: 'Alice', notifications: 3 },
    
    setTheme(theme) {
        this.appTheme = theme;
    }
}">
    <h1>App Theme: <span z-text="appTheme"></span></h1>
    
    <!-- Child Component -->
    <div z-state="{ 
        localSetting: 'child-value',
        
        // Methods can access parent
        toggleParentTheme() {
            const newTheme = $parent.appTheme === 'light' ? 'dark' : 'light';
            $parent.setTheme(newTheme);
        }
    }">
        <!-- Read parent properties -->
        <p>Parent theme: <span z-text="$parent.appTheme"></span></p>
        <p>User name: <span z-text="$parent.user.name"></span></p>
        <p>Notifications: <span z-text="$parent.user.notifications"></span></p>
        
        <!-- Modify parent state -->
        <button z-on:click="$parent.user.notifications = 0">Clear Notifications</button>
        <button z-on:click="toggleParentTheme()">Toggle Theme</button>
        
        <!-- Call parent methods -->
        <button z-on:click="$parent.setTheme('dark')">Set Dark Theme</button>
    </div>
</div>
```

### Reactive State Sharing

Create true state synchronization by sharing references (not copies):

```html
<!-- Parent Component -->
<div z-state="{ 
    sharedCounter: 0,
    sharedSettings: { volume: 50, theme: 'blue' },
    
    increment() { this.sharedCounter++; },
    reset() { this.sharedCounter = 0; }
}">
    <h2>Parent Counter: <span z-text="sharedCounter"></span></h2>
    <button z-on:click="increment()">Parent +1</button>
    <button z-on:click="reset()">Reset</button>
    
    <!-- Child Component with Shared References -->
    <div z-state="{ 
        counter: $parent.sharedCounter,          // Reactive reference
        settings: $parent.sharedSettings,        // Shared object
        
        // Methods operate on shared state
        addFive() { this.counter += 5; },        // Affects parent
        changeTheme(color) { this.settings.theme = color; }
    }">
        <h3>Child Counter: <span z-text="counter"></span></h3>
        <p>Theme: <span z-text="settings.theme"></span></p>
        
        <!-- These affect parent state -->
        <button z-on:click="addFive()">Child +5</button>
        <button z-on:click="counter = 100">Set to 100</button>
        <button z-on:click="changeTheme('red')">Red Theme</button>
        
        <p><small>Child and parent are always in sync!</small></p>
    </div>
</div>
```

### Multi-Level Communication

Communication works across any number of nesting levels:

```html
<!-- Root Component -->
<div z-state="{ 
    globalMessage: '',
    
    setGlobalMessage(msg) {
        this.globalMessage = msg;
    }
}">
    <div>Global: <span z-text="globalMessage"></span></div>
    
    <!-- Level 1 Child -->
    <div z-state="{ level: 1 }">
        <!-- Level 2 Child -->
        <div z-state="{ level: 2 }">
            <!-- Level 3 Child (Grandchild) -->
            <div z-state="{ 
                level: 3,
                sendToRoot() {
                    // Access root component (skipping intermediate levels)
                    $parent.setGlobalMessage('Message from level 3!');
                }
            }">
                <button z-on:click="sendToRoot()">Send to Root</button>
                <p>I'm at level <span z-text="level"></span></p>
            </div>
        </div>
    </div>
</div>
```

## Magic Variables Reference

Zust provides several magic variables accessible in directive expressions:

- **`$store`**: Current component's state object
- **`$parent`**: Parent component's state object  
- **`$event`**: DOM event object (in event handlers)
- **`$element`**: Current DOM element (in intersection observers)

```html
<div z-state="{ name: 'Component' }">
    <!-- $store access (usually implicit) -->
    <span z-text="$store.name"></span>
    
    <!-- $event in handlers -->
    <input z-on:input="handleInput($event, $store)">
    
    <!-- $element in intersection observers -->
    <div z-intersect:visible="processElement($element)">Content</div>
    
    <!-- $parent in child components -->
    <div z-state="{}">
        <span z-text="$parent.name"></span>
    </div>
</div>
```

## Performance Tips

1. **Use `z-key` for lists**: Always provide unique keys for `z-for` loops
2. **Choose the right conditional**: Use `z-show` for frequent toggles, `z-if` for expensive components
3. **Minimize expression complexity**: Extract complex logic to computed properties or methods
4. **Batch DOM updates**: Multiple state changes in the same tick are automatically batched
5. **Use intersection observers**: Lazy load content and track visibility efficiently

```html
<!-- ✅ Good: Computed property -->
<div z-state="{ 
    users: [...],
    get activeUsers() { return this.users.filter(u => u.active); }
}">
    <span z-text="activeUsers.length"></span>
</div>

<!-- ❌ Avoid: Complex inline expressions -->
<span z-text="users.filter(u => u.active && u.role === 'admin').length"></span>
```