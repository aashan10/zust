import type { DirectiveHandler } from '../zust';

export const createBindDirective = (attributeName: string): DirectiveHandler => {
    return (element, value, context) => {
        const { createEffect } = context;
        
        return createEffect(() => {
            try {
                const func = new Function('$store', `with($store) { return ${value}; }`);
                const result = func.call(context.store, context.store);
                
                // Handle different attribute types
                switch (attributeName) {
                    case 'class':
                        handleClassBinding(element, result);
                        break;
                    case 'style':
                        handleStyleBinding(element, result);
                        break;
                    default:
                        handleGenericAttribute(element, attributeName, result);
                        break;
                }
            } catch (error) {
                console.error(`Error in bind:${attributeName} directive for expression "${value}":`, error);
            }
        });
    };
};

function handleClassBinding(element: HTMLElement, value: any) {
    if (typeof value === 'string') {
        element.className = value;
    } else if (typeof value === 'object' && value !== null) {
        // Object syntax: { 'class-name': boolean }
        for (const [className, shouldAdd] of Object.entries(value)) {
            if (shouldAdd) {
                element.classList.add(className);
            } else {
                element.classList.remove(className);
            }
        }
    } else if (Array.isArray(value)) {
        // Array syntax: ['class1', 'class2']
        element.className = value.filter(Boolean).join(' ');
    }
}

function handleStyleBinding(element: HTMLElement, value: any) {
    if (typeof value === 'string') {
        element.style.cssText = value;
    } else if (typeof value === 'object' && value !== null) {
        // Object syntax: { 'property-name': 'value' }
        for (const [property, styleValue] of Object.entries(value)) {
            if (styleValue === null || styleValue === undefined) {
                element.style.removeProperty(property);
            } else {
                element.style.setProperty(property, String(styleValue));
            }
        }
    }
}

function handleGenericAttribute(element: HTMLElement, attributeName: string, value: any) {
    if (value === null || value === undefined || value === false) {
        element.removeAttribute(attributeName);
    } else if (value === true) {
        element.setAttribute(attributeName, '');
    } else {
        element.setAttribute(attributeName, String(value));
    }
}

// Pre-created common bind directives
export const bindClass = createBindDirective('class');
export const bindStyle = createBindDirective('style');
export const bindHref = createBindDirective('href');
export const bindSrc = createBindDirective('src');
export const bindAlt = createBindDirective('alt');
export const bindTitle = createBindDirective('title');
export const bindDisabled = createBindDirective('disabled');
export const bindHidden = createBindDirective('hidden');
export const bindValue = createBindDirective('value');

// Generic bind directive
export const bind: DirectiveHandler = (element, value, context) => {
    console.warn('Generic "bind" directive used. Consider using specific bind directives like "bind:class"');
    return createBindDirective('data-bind')(element, value, context);
};