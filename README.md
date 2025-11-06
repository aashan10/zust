# Zust Framework

A minimalist, modern, and lightweight frontend framework that brings reactive, declarative behavior directly to your HTML.

## Quick Start

```bash
npm install zust
```

```html
<!DOCTYPE html>
<html>
<body>
    <div z-state="{ count: 0 }">
        <h1>Counter: <span z-text="count"></span></h1>
        <button z-on:click="count++">Increment</button>
    </div>

    <script type="module">
        import zust from 'zust';
        zust.start();
    </script>
</body>
</html>
```

## Documentation

For complete documentation, visit the [package README](./packages/zust/README.md).

## Development

This is a monorepo containing:

- `packages/zust/` - The main npm package
- `docs/` - Documentation
- `index.html` - Development demo

### Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build packages
pnpm run build:packages

# Clean build artifacts
pnpm run clean
```

### Package Development

```bash
# Navigate to package
cd packages/zust

# Build the package
pnpm run build

# Watch for changes during development
pnpm run dev
```

## Features

- 🎯 **Declarative & Reactive** - Bind component state directly to the DOM
- 🧩 **Component-Based** - Self-contained components with `z-state`
- ⚡ **Signal-Powered** - Fine-grained reactivity for optimal performance
- 👨‍👩‍👧 **Parent-Child Communication** - Rich communication via `$parent`
- 🔗 **Reactive State Sharing** - True state reference sharing
- 👁️ **Intersection Observer** - Built-in scroll and visibility detection
- 🚀 **Zero Build Step** - Works directly in browsers
- 🔧 **Extensible** - Create custom directives

## License

MIT