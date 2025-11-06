import type { DirectiveHandler } from '../zust';

export const lazy: DirectiveHandler = (element, value, context) => {
    // This directive is only for elements with a 'src' property
    if (!('src' in element)) {
        console.warn('z-lazy directive should only be used on elements with a "src" attribute (e.g., <img>, <video>, <iframe>).', element);
        return;
    }

    const options: IntersectionObserverInit = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const handleIntersection = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Element is visible, let's load the src
                context.batch(() => {
                    const url = context.evaluate(value);
                    if (typeof url === 'string') {
                        (element as HTMLImageElement).src = url;
                    } else {
                        console.warn(`z-lazy expression did not evaluate to a string URL.`, element);
                    }
                });

                // Stop observing the element since we've loaded it
                observer.unobserve(element);
            }
        });
    };

    const observer = new IntersectionObserver(handleIntersection, options);
    observer.observe(element);

    // Return a cleanup function to disconnect the observer if the element is removed
    return () => {
        observer.disconnect();
    };
};