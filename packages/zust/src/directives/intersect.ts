import type { DirectiveHandler } from '../zust';

export const createIntersectDirective = (triggerType: 'visible' | 'invisible'): DirectiveHandler => {
    return (element, value, context) => {
        // Create intersection observer options
        const options: IntersectionObserverInit = {
            root: null, // Use viewport as root
            rootMargin: '0px',
            threshold: 0.1 // Trigger when 10% of element is visible
        };

        const handleIntersection = (entries: IntersectionObserverEntry[]) => {
            entries.forEach(entry => {
                const isVisible = entry.isIntersecting;
                
                // Execute callback based on trigger type and visibility state
                if ((triggerType === 'visible' && isVisible) || 
                    (triggerType === 'invisible' && !isVisible)) {
                    context.batch(() => {
                        context.evaluate(value, { $element: element });
                    });
                }
            });
        };

        // Create and start observing
        const observer = new IntersectionObserver(handleIntersection, options);
        observer.observe(element);

        // Return cleanup function
        return () => {
            observer.unobserve(element);
            observer.disconnect();
        };
    };
};

// Pre-created intersect directives
export const intersectVisible = createIntersectDirective('visible');
export const intersectInvisible = createIntersectDirective('invisible');

// Generic intersect directive (defaults to visible)
export const intersect: DirectiveHandler = (element, value, context) => {
    console.warn('Generic "intersect" directive used. Consider using specific intersect directives like "intersect:visible"');
    return createIntersectDirective('visible')(element, value, context);
};
