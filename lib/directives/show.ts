import type { DirectiveHandler } from '../zust';

export const show: DirectiveHandler = (element, value, context) => {
    const { createEffect } = context;
    
    // Store original display style
    const originalDisplay = element.style.display || '';
    
    return createEffect(() => {
        try {
            // Evaluate the expression in the context of the store
            const func = new Function('$store', `with($store) { return ${value}; }`);
            const shouldShow = func.call(context.store, context.store);
            
            if (shouldShow) {
                // Show the element by restoring original display or removing style
                if (originalDisplay) {
                    element.style.display = originalDisplay;
                } else {
                    element.style.removeProperty('display');
                }
            } else {
                // Hide the element
                element.style.display = 'none';
            }
        } catch (error) {
            console.error(`Error in show directive for expression "${value}":`, error);
        }
    });
};