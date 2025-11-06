import type { DirectiveHandler } from '../zust';

export const text: DirectiveHandler = (element, value, context) => {
    const { createEffect, evaluate } = context;
    
    return createEffect(() => {
        const result = evaluate(value);
        element.textContent = String(result ?? '');
    });
};