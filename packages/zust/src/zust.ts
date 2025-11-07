import { initialize } from './reactivity';
import { text } from './directives/text';
import { show } from './directives/show';
import { createBindDirective, bindValue, bindClass, bindStyle, bindSrc, bindAlt, bindHref, bindTitle, bindHidden, bindDisabled } from './directives/bind';
import { clickOutside, createOnDirective } from './directives/on';
import { model } from './directives/model';
import { forDirective } from './directives/for';
import { lazy } from './directives/lazy';
import { intersectVisible, intersectInvisible } from './directives/intersect';

type DirectiveHandler = (element: HTMLElement, value: string, context: ComponentContext) => void | (() => void);

interface DirectiveDefinition {
    handler: DirectiveHandler;
    priority: number;
}

// Priority constants (higher number = processed first)
const DIRECTIVE_PRIORITIES = {
    FOR: 1000,
    IF: 900, 
    SHOW: 100,
    TEXT: 50,
    MODEL: 50,
    BIND: 50,
    ON: 50
} as const;

interface ComponentContext {
    store: any;
    setStore: (pathOrUpdater: string | ((prev: any) => any), value?: any) => void;
    element: HTMLElement;
    createSignal: any;
    createEffect: any;
    createMemo: any;
    createStore: any;
    batch: any;
    zustInstance: Zust;
    parent?: ComponentContext;
    evaluate: (expression: string, additionalParams?: Record<string, any>) => any;
}

class Zust {
    private _prefix: string;
    private directives: Map<string, DirectiveDefinition> = new Map();
    private components: WeakMap<HTMLElement, ComponentContext> = new WeakMap();
    private observer: MutationObserver;

    get prefix(): string {
        return this._prefix;
    }

    constructor(prefix: string = 'z') {
        this._prefix = prefix;
        this.setupMutationObserver();
        this.registerBuiltinDirectives();
        // Don't scan immediately - let external directives be registered first
    }

    /**
     * Register built-in directives
     */
    private registerBuiltinDirectives(): void {

        // Register core directives
        this.directives.set('if', {
            handler: this.createIfDirective(),
            priority: DIRECTIVE_PRIORITIES.IF
        });
        
        this.directives.set('for', {
            handler: forDirective,
            priority: DIRECTIVE_PRIORITIES.FOR
        });
        
        this.directives.set('text', {
            handler: text,
            priority: DIRECTIVE_PRIORITIES.TEXT
        });
        
        this.directives.set('show', {
            handler: show,
            priority: DIRECTIVE_PRIORITIES.SHOW
        });
        
        this.directives.set('model', {
            handler: model,
            priority: DIRECTIVE_PRIORITIES.MODEL
        });
        
        this.directives.set('lazy', {
            handler: lazy,
            priority: 50
        });

        // Register bind directives
        this.directives.set('bind', {
            handler: createBindDirective(''),
            priority: DIRECTIVE_PRIORITIES.BIND
        });
        
        const bindingTypes = {
            value: bindValue,
            class: bindClass,
            style: bindStyle,
            href: bindHref,
            hidden: bindHidden,
            alt: bindAlt,
            title: bindTitle,
            disabled: bindDisabled,
            src: bindSrc,
        };

        Object.entries(bindingTypes).forEach(([type, handler]) => {
            this.directives.set(`bind:${type}`, {
                handler,
                priority: DIRECTIVE_PRIORITIES.BIND
            });
        });

        // Register event directives
        const eventTypes = ['click', 'input', 'change', 'submit', 'focus', 'blur', 'mouseenter', 'mouseleave', 'mouseover', 'mouseout', 'keydown', 'keyup'];
        eventTypes.forEach(eventType => {
            this.directives.set(`on:${eventType}`, {
                handler: createOnDirective(eventType),
                priority: DIRECTIVE_PRIORITIES.ON
            });
        });

        this.directives.set('on:click-outside', {
            handler: clickOutside,
            priority: DIRECTIVE_PRIORITIES.ON
        });

        // Register intersection observer directives
        this.directives.set('intersect:visible', {
            handler: intersectVisible,
            priority: 50
        });
        
        this.directives.set('intersect:invisible', {
            handler: intersectInvisible,
            priority: 50
        });
    }

    /**
     * Register a custom directive
     */
    directive(name: string, handler: DirectiveHandler, priority: number = 50): void {
        this.directives.set(name, { handler, priority });
    }

    /**
     * Initialize Zust and scan the document for components
     */
    start(): void {
        this.scanDocument();
    }

    /**
     * Get the component context for an element
     */
    getContext(element: HTMLElement): ComponentContext | undefined {
        // Walk up the DOM tree to find the nearest component
        let current: HTMLElement | null = element;
        while (current) {
            if (this.components.has(current)) {
                return this.components.get(current);
            }
            current = current.parentElement;
        }
        return undefined;
    }

    /**
     * Get the parent component context for an element
     */
    private getParentContext(element: HTMLElement): ComponentContext | undefined {
        // Walk up the DOM tree to find the nearest parent component
        let current: HTMLElement | null = element.parentElement;
        while (current) {
            if (this.components.has(current)) {
                return this.components.get(current);
            }
            current = current.parentElement;
        }
        return undefined;
    }

    private setupMutationObserver(): void {
        this.observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.scanElement(node as HTMLElement);
                        }
                    });
                }
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    private scanDocument(): void {
        this.scanElement(document.body);
    }

    private scanElement(root: HTMLElement): void {
        // Check if root element is a component
        if (this.isComponent(root)) {
            this.initializeComponent(root);
        }

        // Scan all descendants for components
        const components = root.querySelectorAll(`[${this._prefix}-state]`);
        components.forEach((element) => {
            if (element instanceof HTMLElement) {
                this.initializeComponent(element);
            }
        });
    }

    private isComponent(element: HTMLElement): boolean {
        return element.hasAttribute(`${this._prefix}-state`);
    }

    private initializeComponent(element: HTMLElement): void {
        // Skip if already initialized
        if (this.components.has(element)) {
            return;
        }

        const stateAttr = element.getAttribute(`${this._prefix}-state`);
        if (!stateAttr) {
            return;
        }



        try {
            // Find parent component context first
            const parentContext = this.getParentContext(element);

            // Inherit reactivity context from parent, or create a new one for the root.
            const reactivity = parentContext ? {
                createSignal: parentContext.createSignal,
                createEffect: parentContext.createEffect,
                createMemo: parentContext.createMemo,
                batch: parentContext.batch,
                createStore: parentContext.createStore
            } : initialize();
            
            const { createSignal, createEffect, createMemo, batch, createStore } = reactivity;

            // Parse and create the initial state with parent context
            const initialState = this.parseState(stateAttr, parentContext);

            // Each component gets its own isolated store.
            const [store, setStore] = createStore(initialState);
            
            // Add $parent reference to the store for this.$parent access
            if (parentContext) {
                Object.defineProperty(store, '$parent', {
                    get: () => parentContext.store,
                    enumerable: false,
                    configurable: true
                });
            }

            // Create evaluate function for this context
            const evaluate = (expression: string, additionalParams: Record<string, any> = {}) => {
                try {
                    // Build parameter list: always include $store, $parent, plus any additional params
                    const paramNames = ['$store', '$parent', ...Object.keys(additionalParams)];
                    const paramValues = [store, parentContext?.store, ...Object.values(additionalParams)];
                    
                    const func = new Function(...paramNames, `with($store) { return ${expression}; }`);
                    return func.call(store, ...paramValues);
                } catch (error) {
                    console.error(`Error evaluating expression "${expression}":`, error);
                    return undefined;
                }
            };

            // Create component context
            const context: ComponentContext = {
                store,
                setStore,
                element,
                createSignal,
                createEffect,
                createMemo,
                createStore, // Pass createStore down to children
                batch,
                zustInstance: this,
                parent: parentContext,
                evaluate
            };

            // Store the context
            this.components.set(element, context);

            // Batch the initial directive processing to prevent multiple effect executions
            batch(() => {
                // Process all directives on this element and its descendants
                this.processDirectives(element, context);
            });

            // After initialization, check for and run the init() method
            if (typeof store.init === 'function') {
                // Call init with the store as its `this` context.
                // Using queueMicrotask ensures it runs after the initial render batch.
                queueMicrotask(() => store.init.call(store));
            }

        } catch (error) {
            console.error(`Failed to initialize component on element:`, element, error);
        }
    }

    private parseState(stateString: string, parentContext?: ComponentContext): any {
        try {
            // Pre-process state string to replace parent references with getters/setters
            let processedStateString = stateString;
            const parentBindings: { childProp: string, parentProp: string }[] = [];
            
            if (parentContext) {
                // Find parent property references and collect them
                const parentRefRegex = /(\w+):\s*\$parent\.(\w+)/g;
                let match;
                
                while ((match = parentRefRegex.exec(stateString)) !== null) {
                    const [fullMatch, childProp, parentProp] = match;
                    parentBindings.push({ childProp, parentProp });
                    
                    // Replace the assignment with undefined for now
                    processedStateString = processedStateString.replace(fullMatch, `${childProp}: undefined`);
                }
            }
            
            // Create a safe evaluation context with parent access
            const func = new Function('$parent', 'return ' + processedStateString);
            const initialState = func(parentContext?.store);
            
            // Now add the reactive parent bindings
            if (parentContext && parentBindings.length > 0) {
                this.createReactiveParentBindings(initialState, parentContext, parentBindings);
            }
            
            return initialState;
        } catch (error) {
            console.error('Failed to parse state:', stateString, error);
            return {};
        }
    }

    private createReactiveParentBindings(state: any, parentContext: ComponentContext, bindings: { childProp: string, parentProp: string }[]): void {
        bindings.forEach(({ childProp, parentProp }) => {
            // Create getter/setter that always references parent property
            Object.defineProperty(state, childProp, {
                get() {
                    return parentContext.store[parentProp];
                },
                set(value) {
                    parentContext.setStore(parentProp, value);
                },
                enumerable: true,
                configurable: true
            });
        });
    }

    processDirectives(element: HTMLElement, context: ComponentContext): () => void {
        // Process directives on the root element
        let allCleanups = this.processElementDirectives(element, context);

        // Collect all descendant elements first
        const elementsToProcess: HTMLElement[] = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_ELEMENT,
            {
                acceptNode: (node) => {
                    // Skip nested components - they have their own context
                    if (node !== element && this.isComponent(node as HTMLElement)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        let currentNode = walker.nextNode();
        while (currentNode) {
            if (currentNode instanceof HTMLElement) {
                elementsToProcess.push(currentNode);
            }
            currentNode = walker.nextNode();
        }

        // Process all collected elements
        for (const elementToProcess of elementsToProcess) {
            allCleanups.push(...this.processElementDirectives(elementToProcess, context));
        }

        return () => {
            allCleanups.forEach(cleanup => cleanup());
        };
    }

    private processElementDirectives(element: HTMLElement, context: ComponentContext): (() => void)[] {
        const attributes = Array.from(element.attributes);
        const cleanups: (() => void)[] = [];
        const foundDirectives: Array<{
            name: string;
            value: string;
            definition: DirectiveDefinition;
        }> = [];
        
        for (const attr of attributes) {
            if (attr.name.startsWith(`${this._prefix}-`) && attr.name !== `${this._prefix}-state`) {
                const directiveName = attr.name.substring(this._prefix.length + 1);
                const directiveDefinition = this.directives.get(directiveName);
                
                if (directiveDefinition) {
                    foundDirectives.push({
                        name: directiveName,
                        value: attr.value,
                        definition: directiveDefinition
                    });
                } else {
                    console.warn(`No handler found for directive: ${directiveName}`);
                }
            }
        }
        
        // Sort by priority (higher first)
        foundDirectives.sort((a, b) => b.definition.priority - a.definition.priority);
        
                // Process directives in priority order
        
                for (const directive of foundDirectives) {
        
                    try {
        
                        const cleanup = directive.definition.handler(element, directive.value, context);
        
                        if (typeof cleanup === 'function') {
        
                            cleanups.push(cleanup);
        
                        }
        
                        
        
                        if (directive.name === 'for' || directive.name === 'if') {
        
                            break;
        
                        }
        
                    } catch (error) {
        
                        console.error(`Error executing directive ${directive.name}:`, error);
        
                    }
        
                }
        
        
        
                return cleanups;
    }

    /**
     * Create the built-in z-if directive (Alpine.js style)
     */
    private createIfDirective(): DirectiveHandler {
        return (element: HTMLElement, value: string, context: ComponentContext) => {
            const { createEffect, batch } = context;
            
            // Store the original element and its position
            const originalElement = element;
            const parentElement = element.parentElement!;
            const nextSibling = element.nextSibling;
            
            // Create a placeholder comment to mark the position
            const placeholder = document.createComment(`z-if: ${value}`);
            parentElement.insertBefore(placeholder, element);
            
            // Track current state
            let isCurrentlyShown = false;
            let renderedElement: HTMLElement | null = null;
            
            // Function to show the element
            const showElement = () => {
                if (!isCurrentlyShown) {
                    batch(() => {
                        // Clone the original element and remove z-if
                        renderedElement = originalElement.cloneNode(true) as HTMLElement;
                        renderedElement.removeAttribute(`${this._prefix}-if`);
                        
                        // Insert the rendered element
                        parentElement.insertBefore(renderedElement, placeholder.nextSibling);
                        
                        // Process directives on the rendered element
                        this.processDirectives(renderedElement, context);
                        
                        isCurrentlyShown = true;
                    });
                }
            };
            
            // Function to hide the element
            const hideElement = () => {
                if (isCurrentlyShown && renderedElement) {
                    renderedElement.remove();
                    renderedElement = null;
                    isCurrentlyShown = false;
                }
            };
            
            // Remove the original element from DOM (it's just a template)
            originalElement.remove();
            
            // Create reactive effect to watch the condition
            return createEffect(() => {
                const shouldShow = context.evaluate(value);
                
                if (shouldShow) {
                    showElement();
                } else {
                    hideElement();
                }
            });
        };
    }


    /**
     * Cleanup method to remove observers and components
     */
    destroy(): void {
        this.observer.disconnect();
        this.components = new WeakMap();
        this.directives.clear();
    }
} 

export { Zust };
export type { DirectiveHandler, ComponentContext };
