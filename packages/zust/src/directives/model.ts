import type { DirectiveHandler } from '../zust';

export const model: DirectiveHandler = (element, value, context) => {
    const { createEffect, setStore } = context;
    
    // Only work with form elements
    if (!(element instanceof HTMLInputElement || 
          element instanceof HTMLTextAreaElement || 
          element instanceof HTMLSelectElement)) {
        console.warn('model directive can only be used on input, textarea, or select elements');
        return;
    }
    
    // Handle different input types
    const getElementValue = () => {
        if (element instanceof HTMLInputElement) {
            switch (element.type) {
                case 'checkbox':
                    return element.checked;
                case 'radio':
                    return element.checked ? element.value : undefined;
                case 'number':
                case 'range':
                    return element.valueAsNumber;
                default:
                    return element.value;
            }
        }
        return element.value;
    };
    
    const setElementValue = (newValue: any) => {
        if (element instanceof HTMLInputElement) {
            switch (element.type) {
                case 'checkbox':
                    element.checked = Boolean(newValue);
                    break;
                case 'radio':
                    element.checked = element.value === String(newValue);
                    break;
                case 'number':
                case 'range':
                    element.value = String(newValue || 0);
                    break;
                default:
                    element.value = String(newValue || '');
            }
        } else {
            element.value = String(newValue || '');
        }
    };
    
    // Event listener for input changes
    const handleInput = () => {
        const newValue = getElementValue();
        
        // For radio buttons, only update if this radio is checked
        if (element instanceof HTMLInputElement && element.type === 'radio' && !element.checked) {
            return;
        }
        
        try {
            // Use a function to perform the assignment, allowing it to work with loop variables.
            const setter = new Function('$store', '$value', '$parent', `with($store) { ${value} = $value }`);
            context.batch(() => {
                setter.call(context.store, context.store, newValue, context.parent?.store);
            });
        } catch (error) {
            console.error(`Error updating model for path "${value}":`, error);
        }
    };
    
    // Choose appropriate event based on element type
    const eventType = element instanceof HTMLInputElement && 
                     (element.type === 'text' || element.type === 'textarea') 
                     ? 'input' : 'change';
    
    element.addEventListener(eventType, handleInput);
    
    // Create effect to sync store changes back to element
    const cleanup = createEffect(() => {
        const storeValue = context.evaluate(value);
        
        // Only update if the value is different to avoid infinite loops
        const currentValue = getElementValue();
        if (currentValue !== storeValue) {
            setElementValue(storeValue);
        }
    });
    
    // Return cleanup function
    return () => {
        element.removeEventListener(eventType, handleInput);
        if (typeof cleanup === 'function') {
            cleanup();
        }
    };
};