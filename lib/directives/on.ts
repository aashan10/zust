import type { DirectiveHandler } from '../zust';

export const createOnDirective = (eventType: string): DirectiveHandler => {
    return (element, value, context) => {
        const handleEvent = (event: Event) => {
            try {
                // Batch all effects that result from this event handler
                context.batch(() => {
                    // Create function with event and store in scope
                    const func = new Function('$event', '$store', `with($store) { return ${value}; }`);
                    func.call(context.store, event, context.store);
                });
            } catch (error) {
                console.error(`Error in on:${eventType} directive for expression "${value}":`, error);
            }
        };
        
        element.addEventListener(eventType, handleEvent);
        
        // Return cleanup function
        return () => {
            element.removeEventListener(eventType, handleEvent);
        };
    };
};

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