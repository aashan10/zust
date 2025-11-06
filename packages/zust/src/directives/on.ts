import type { DirectiveHandler } from '../zust';

export const createOnDirective = (eventType: string): DirectiveHandler => {
    return (element, value, context) => {
        const { batch, evaluate } = context;
        
        const handleEvent = (event: Event) => {
            // Batch all effects that result from this event handler
            batch(() => {
                evaluate(value, { $event: event });
            });
        };
        
        element.addEventListener(eventType, handleEvent);
        
        // Return cleanup function
        return () => {
            element.removeEventListener(eventType, handleEvent);
        };
    };
};

export const clickOutside: DirectiveHandler = (element, value, context) => {
    const { batch, evaluate } = context;

    const listener = (e: MouseEvent) => {
        if (!e.target) {
            return;
        }

        if (!element.contains(e.target as HTMLElement)) {
            batch(() => {
                evaluate(value, { $event: e });
            });
        }
    }

    document.addEventListener('click', listener);

    return () => {
        document.removeEventListener('click', listener);
    }

}

// Pre-created common event directives
export const onClick = createOnDirective('click');
export const onInput = createOnDirective('input');
export const onChange = createOnDirective('change');
export const onSubmit = createOnDirective('submit');
export const onFocus = createOnDirective('focus');
export const onBlur = createOnDirective('blur');
export const onMouseover = createOnDirective('mouseover');
export const onMouseout = createOnDirective('mouseout');
export const onKeydown = createOnDirective('keydown');
export const onKeyup = createOnDirective('keyup');

// Generic on directive that can handle any event type
export const on: DirectiveHandler = (element, value, context) => {
    console.warn('Generic "on" directive used. Consider using specific event directives like "on:click"');
    return createOnDirective('click')(element, value, context);
};
