import type { DirectiveHandler } from '../zust';

export const show: DirectiveHandler = (element, value, context) => {
    const { createEffect, evaluate } = context;
    
    // Store original display style
    const originalDisplay = element.style.display || '';
    
    return createEffect(() => {
        const shouldShow = evaluate(value);
        
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
    });
};