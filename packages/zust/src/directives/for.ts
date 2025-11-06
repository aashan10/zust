import type { DirectiveHandler, ComponentContext } from '../zust';

interface ForItem {
    elements: HTMLElement[];
    key: any;
    context: ComponentContext;
    cleanup: () => void;
}

export const forDirective: DirectiveHandler = (element, value, context) => {
    const { createEffect, batch, zustInstance } = context;
    const prefix = zustInstance.prefix;

    const isTemplate = element.tagName.toLowerCase() === 'template';
    if (!isTemplate) {
        console.warn(`z-for is best used with a <template> tag.`, element);
    }

    const parseForExpression = (expr: string) => {
        const match = expr.match(/^(?:\(([^,]+),\s*([^)]+)\)|([^\s,]+))\s+in\s+(.+)$/);
        if (!match) throw new Error(`Invalid z-for expression: "${expr}"`);
        return {
            itemVar: match[1]?.trim() || match[3]?.trim(),
            indexVar: match[2]?.trim() || '$index',
            itemsExpr: match[4].trim(),
        };
    };

    const { itemVar, indexVar, itemsExpr } = parseForExpression(value);

    const templateNode = isTemplate ? (element as HTMLTemplateElement).content : element;
    const keyAttr = `${prefix}-key`;
    const keyExpr = element.getAttribute(keyAttr) || null;

    const parentElement = element.parentElement!;
    const placeholder = document.createComment(`z-for: ${value}`);
    parentElement.insertBefore(placeholder, element);
    element.remove();

    let renderedItems: ForItem[] = [];

    const createScopedContext = (item: any, index: number): ComponentContext => {
        const scope = { [itemVar]: item, [indexVar]: index };
        const storeWithScope = new Proxy(context.store, {
            get: (target, prop, receiver) => (prop in scope ? scope[prop as string] : Reflect.get(target, prop, receiver)),
            set: (target, prop, value, receiver) => (prop in scope ? false : Reflect.set(target, prop, value, receiver)),
            has: (target, prop) => (prop in scope || Reflect.has(target, prop)),
            ownKeys: (target) => [...Object.keys(scope), ...Reflect.ownKeys(target)],
            getOwnPropertyDescriptor: (target, prop) => (
                prop in scope
                    ? { value: scope[prop as string], writable: true, enumerable: true, configurable: true }
                    : Reflect.getOwnPropertyDescriptor(target, prop)
            ),
        });
        
        // Create a new evaluate function that includes scoped variables
        const evaluate = (expression: string, additionalParams: Record<string, any> = {}) => {
            try {
                // Merge scope variables with additional params
                const allParams = { ...scope, ...additionalParams };
                const paramNames = ['$store', '$parent', ...Object.keys(allParams)];
                const paramValues = [storeWithScope, context.parent?.store, ...Object.values(allParams)];
                
                const func = new Function(...paramNames, `with($store) { return ${expression}; }`);
                return func.call(storeWithScope, ...paramValues);
            } catch (error) {
                console.error(`Error evaluating expression "${expression}":`, error);
                return undefined;
            }
        };
        
        return { ...context, store: storeWithScope, evaluate };
    };

    const getItemKey = (scopedContext: ComponentContext, index: number) => {
        if (keyExpr) {
            return scopedContext.evaluate(keyExpr) ?? index;
        }
        return index;
    };

    return createEffect(() => {
        const items = context.evaluate(itemsExpr);
        if (!Array.isArray(items)) {
            console.warn(`z-for expression "${itemsExpr}" did not return an array.`);
            return;
        }

        batch(() => {
            const newRenderedItems: ForItem[] = [];
            const oldItemsByKey = new Map(renderedItems.map(item => [item.key, item]));

            for (let i = 0; i < items.length; i++) {
                const scopedContext = createScopedContext(items[i], i);
                const key = getItemKey(scopedContext, i);
                const oldItem = oldItemsByKey.get(key);

                if (oldItem) {
                    // Item is being reused, clean up old directives and re-process
                    oldItem.cleanup();
                    const newCleanup = zustInstance.processDirectives(oldItem.elements[0], scopedContext);
                    oldItem.context = scopedContext;
                    oldItem.cleanup = newCleanup;
                    newRenderedItems.push(oldItem);
                    oldItemsByKey.delete(key);
                } else {
                    // New item, render it
                    const fragment = templateNode.cloneNode(true) as DocumentFragment;
                    const elements = Array.from(fragment.children).filter((c): c is HTMLElement => c instanceof HTMLElement);
                    elements.forEach(el => el.removeAttribute(`${prefix}-for`));

                    // Insert the raw, unprocessed elements into the DOM first.
                    // This ensures they have a parent when directives like z-if are processed.
                    // The final re-ordering loop will place them correctly.
                    parentElement.insertBefore(fragment, placeholder);
                    
                    const cleanup = zustInstance.processDirectives(elements[0], scopedContext);

                    newRenderedItems.push({ elements, key, context: scopedContext, cleanup });
                }
            }

            // Remove old items that are no longer in the list
            for (const oldItem of oldItemsByKey.values()) {
                oldItem.cleanup();
                oldItem.elements.forEach(el => el.remove());
            }

            // Re-order the DOM elements to match the new order
            let lastElement: Element | Comment = placeholder;
            for (const item of newRenderedItems) {
                for (const el of item.elements) {
                    if (el.previousSibling !== lastElement) {
                        parentElement.insertBefore(el, lastElement.nextSibling);
                    }
                    lastElement = el;
                }
            }

            renderedItems = newRenderedItems;
        });
    });
};