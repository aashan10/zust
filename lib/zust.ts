import { initialize } from './reactivity';

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
    batch: any;
    zustInstance: Zust;
}

class Zust {
    private prefix: string;
    private directives: Map<string, DirectiveDefinition> = new Map();
    private components: WeakMap<HTMLElement, ComponentContext> = new WeakMap();
    private observer: MutationObserver;

    constructor(prefix: string = 'z') {
        this.prefix = prefix;
        this.setupMutationObserver();
        this.registerBuiltinDirectives();
        // Don't scan immediately - let external directives be registered first
    }

    /**
     * Register built-in directives
     */
    private registerBuiltinDirectives(): void {
        // Register z-if directive with high priority
        this.directives.set('if', {
            handler: this.createIfDirective(),
            priority: DIRECTIVE_PRIORITIES.IF
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
        const components = root.querySelectorAll(`[${this.prefix}-state]`);
        components.forEach((element) => {
            if (element instanceof HTMLElement) {
                this.initializeComponent(element);
            }
        });
    }

    private isComponent(element: HTMLElement): boolean {
        return element.hasAttribute(`${this.prefix}-state`);
    }

    private initializeComponent(element: HTMLElement): void {
        // Skip if already initialized
        if (this.components.has(element)) {
            return;
        }

        const stateAttr = element.getAttribute(`${this.prefix}-state`);
        if (!stateAttr) {
            return;
        }



        try {
            // Create isolated reactivity context for this component
            const { createSignal, createEffect, createMemo, createStore, batch } = initialize();

            // Parse and create the initial state
            const initialState = this.parseState(stateAttr);
            const [store, setStore] = createStore(initialState);

            // Create component context
            const context: ComponentContext = {
                store,
                setStore,
                element,
                createSignal,
                createEffect,
                createMemo,
                batch,
                zustInstance: this
            };

            // Store the context
            this.components.set(element, context);



            // Batch the initial directive processing to prevent multiple effect executions
            batch(() => {
                // Process all directives on this element and its descendants
                this.processDirectives(element, context);
            });

        } catch (error) {
            console.error(`Failed to initialize component on element:`, element, error);
        }
    }

    private parseState(stateString: string): any {
        try {
            // Create a safe evaluation context
            const func = new Function('return ' + stateString);
            return func();
        } catch (error) {
            console.error('Failed to parse state:', stateString, error);
            return {};
        }
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
            if (attr.name.startsWith(`${this.prefix}-`) && attr.name !== `${this.prefix}-state`) {
                const directiveName = attr.name.substring(this.prefix.length + 1);
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
                        renderedElement.removeAttribute(`${this.prefix}-if`);
                        
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
                try {
                    const func = new Function('$store', `with($store) { return ${value}; }`);
                    const shouldShow = func(context.store);
                    

                } catch (error) {
                    console.error(`Error in z-if directive for expression "${value}":`, error);
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
export type { DirectiveHandler };
