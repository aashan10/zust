 const initialize = () =>  {

    // A subscriber is a function that is executed when a signal changes.
    type Subscriber<T> = {
        dependencies: Set<Set<Subscriber<T>>>
        execute: () => T
    }

    // The context is a stack of subscribers. The top of the stack is the currently running subscriber.
    let context: Array<Subscriber<any>> = [];
    
    // Batching state to defer effect execution
    let isBatching = false;
    let batchedEffects: Set<() => any> = new Set();


    // A signal is a pair of a getter and a setter.
    function createSignal<T>(value: T): [() => T, (value: T) => void] {
        let data = value;
        let subscriptions: Set<Subscriber<T>> = new Set();

        const get = () => {
            const running = context[context.length - 1];
            if (running) {
                subscribe(running, subscriptions);
            }

            return data;
        };
        const set = (value: T) => {
            data = value;

            for (const subscription of [...subscriptions]) {
                if (isBatching) {
                    batchedEffects.add(subscription.execute);
                } else {
                    subscription.execute();
                }
            }
        }

        return [get, set];
    }

    // A subscriber is added to the dependencies of the currently running subscriber.
    function subscribe<T>(running: Subscriber<T>, subscriptions: Set<Subscriber<T>>) {
        subscriptions.add(running);
        running.dependencies.add(subscriptions);
    }

    // Currently running subscriber is removed from the dependencies of all subscribers.
    // Also, all subscribers are removed from the dependencies of the currently running subscriber.
    function cleanup<T>(running: Subscriber<T>) {
        for (const dep of running.dependencies) {
            dep.delete(running);
        }
        running.dependencies.clear();
    }
    
    // An effect is a function that is executed when a signal changes.
    function createEffect<T>(callback: () => T): T {
        const execute = () => {
            cleanup(running);
            context.push(running);
            try {
                return callback();
            } finally {
                context.pop();
            }
        }
    
        const running: Subscriber<T> = {
            dependencies: new Set(),
            execute
        }
    
        return execute();
    }

    // A memo is a signal that is only updated when its dependencies change.
    function createMemo<T>(fn: () => T) {
        const [get, set] = createSignal<T>(fn());
        createEffect(() => set(fn()));
        return get;
    }

    // Store implementation using proxies for deep reactivity
    function createStore<T extends Record<string | number | symbol, any>>(initialValue: T): [T, (path: string | ((prev: T) => T), value?: any) => void] {
        const signals = new Map<string, ReturnType<typeof createSignal>>();
        
        function getSignalForPath(path: string) {
            if (!signals.has(path)) {
                const value = getNestedValue(initialValue, path);
                signals.set(path, createSignal(value));
            }
            return signals.get(path)!;
        }
        
        function getNestedValue(obj: any, path: string) {
            return path.split('.').reduce((current, key) => {
                if (current && typeof current === 'object') {
                    return current[key];
                }
                return undefined;
            }, obj);
        }
        
        function setNestedValue(obj: any, path: string, value: any) {
            const keys = path.split('.');
            const lastKey = keys.pop()!;
            const target = keys.reduce((current, key) => {
                if (!current[key] || typeof current[key] !== 'object') {
                    current[key] = {};
                }
                return current[key];
            }, obj);
            target[lastKey] = value;
        }
        
        function createReactiveProxy(target: any, basePath: string = ''): any {
            return new Proxy(target, {
                get(obj, prop) {
                    const path = basePath ? `${basePath}.${String(prop)}` : String(prop);
                    const value = obj[prop];
                    
                    // Track access for reactivity
                    const [getter] = getSignalForPath(path);
                    getter();
                    
                    // Return reactive proxy for nested objects/arrays
                    if (value && typeof value === 'object') {
                        return createReactiveProxy(value, path);
                    }
                    
                    return value;
                },
                
                set(obj, prop, value) {
                    const path = basePath ? `${basePath}.${String(prop)}` : String(prop);
                    const oldValue = obj[prop];

                    if (oldValue === value) {
                        return true;
                    }

                    obj[prop] = value;

                    // Notify for the specific path that changed
                    const [, setter] = getSignalForPath(path);
                    setter(value);

                    // Notify parent paths by creating new references to signal that they have changed.
                    const pathParts = path.split('.');
                    for (let i = pathParts.length - 1; i > 0; i--) {
                        const parentPath = pathParts.slice(0, i).join('.');
                        if (signals.has(parentPath)) {
                            const [, parentSetter] = signals.get(parentPath)!;
                            const parentValue = getNestedValue(initialValue, parentPath);
                            if (parentValue) {
                                const newParentValue = Array.isArray(parentValue) ? [...parentValue] : { ...parentValue };
                                parentSetter(newParentValue);
                            }
                        }
                    }
                    
                    return true;
                },
                
                has(obj, prop) {
                    const path = basePath ? `${basePath}.${String(prop)}` : String(prop);
                    const [getter] = getSignalForPath(path);
                    getter();
                    return prop in obj;
                },
                
                ownKeys(obj) {
                    const path = basePath || 'root';
                    const [getter] = getSignalForPath(path);
                    getter();
                    return Reflect.ownKeys(obj);
                }
            });
        }
        
        const store = createReactiveProxy(initialValue);
        
        const setStore = (pathOrUpdater: string | ((prev: T) => T), value?: any) => {
            // Batch all store updates to prevent multiple effect executions
            batch(() => {
                if (typeof pathOrUpdater === 'function') {
                    // Functional update
                    const newValue = pathOrUpdater(initialValue);
                    Object.assign(initialValue, newValue);
                    
                    // Update all existing signals
                    for (const [path] of signals) {
                        const [, setter] = signals.get(path)!;
                        setter(getNestedValue(initialValue, path));
                    }
                } else {
                    // Path-based update
                    setNestedValue(initialValue, pathOrUpdater, value);
                    
                    // Update signal for this path and parent paths
                    const [, setter] = getSignalForPath(pathOrUpdater);
                    setter(value);
                    
                    let currentPath = '';
                    const pathParts = pathOrUpdater.split('.');
                    for (let i = 0; i < pathParts.length; i++) {
                        currentPath = pathParts.slice(0, i + 1).join('.');
                        if (signals.has(currentPath)) {
                            const [, parentSetter] = signals.get(currentPath)!;
                            parentSetter(getNestedValue(initialValue, currentPath));
                        }
                    }
                }
            });
        };
        
        return [store, setStore];
    }

    // Batch multiple signal updates to prevent intermediate effect executions
    function batch<T>(fn: () => T): T {
        if (isBatching) {
            return fn();
        }
        
        isBatching = true;
        try {
            const result = fn();
            
            // Execute all batched effects
            for (const effect of batchedEffects) {
                effect();
            }
            batchedEffects.clear();
            
            return result;
        } finally {
            isBatching = false;
        }
    }


    return {
        createSignal,
        createEffect,
        createMemo,
        createStore,
        batch
    }

}

const {createSignal, createEffect, createMemo, createStore, batch} = initialize();

export { createSignal, createEffect, createMemo, createStore, batch, initialize};
