import type { DirectiveHandler } from '../zust';

export const text: DirectiveHandler = (element, value, context) => {
    const { createEffect } = context;
    
    return createEffect(() => {
        try {
            // Evaluate the expression in the context of the store
            const func = new Function('$store', `with($store) { return ${value}; }`);
            const result = func.call(context.store, context.store);
            
            // Convert result to string and set as text content
            element.textContent = String(result ?? '');
        } catch (error) {
            console.error(`Error in text directive for expression "${value}":`, error);
            element.textContent = '';
        }
    });
};