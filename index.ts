import { Zust } from './lib/zust';
import { show } from './lib/directives/show';
import { model } from './lib/directives/model';
import { text } from './lib/directives/text';
import { forDirective } from './lib/directives/for';
import { 
    createOnDirective, 
    onClick, 
    onInput, 
    onChange, 
    onSubmit, 
    onFocus, 
    onBlur, 
    onMouseover, 
    onMouseout, 
    onKeydown, 
    onKeyup 
} from './lib/directives/on';
import { 
    createBindDirective, 
    bindClass, 
    bindStyle, 
    bindHref, 
    bindSrc, 
    bindAlt, 
    bindTitle, 
    bindDisabled, 
    bindHidden, 
    bindValue 
} from './lib/directives/bind';

// Create a default Zust instance
export function createZust(prefix: string = 'z') {
    const zust = new Zust(prefix);
    

    
    // Register core directives with priorities
    zust.directive('for', forDirective); // FOR priority
    zust.directive('show', show); // SHOW priority
    zust.directive('model', model); // MODEL priority  
    zust.directive('text', text); // TEXT priority
    
    // Register event directives with ON priority
    zust.directive('on:click', onClick);
    zust.directive('on:input', onInput);
    zust.directive('on:change', onChange);
    zust.directive('on:submit', onSubmit);
    zust.directive('on:focus', onFocus);
    zust.directive('on:blur', onBlur);
    zust.directive('on:mouseover', onMouseover);
    zust.directive('on:mouseout', onMouseout);
    zust.directive('on:keydown', onKeydown);
    zust.directive('on:keyup', onKeyup);
    
    // Register bind directives with BIND priority
    zust.directive('bind:class', bindClass);
    zust.directive('bind:style', bindStyle);
    zust.directive('bind:href', bindHref);
    zust.directive('bind:src', bindSrc);
    zust.directive('bind:alt', bindAlt);
    zust.directive('bind:title', bindTitle);
    zust.directive('bind:disabled', bindDisabled);
    zust.directive('bind:hidden', bindHidden);
    zust.directive('bind:value', bindValue);
    zust.directive('key', () => { });
    

    
    return zust;
}

// Auto-start with default configuration when imported
export const zust = createZust();

// Start scanning the document when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        zust.start();
    });
} else {
    zust.start();
}

// Export utilities for custom usage
export { Zust } from './lib/zust';
export type { DirectiveHandler } from './lib/zust';
export { createOnDirective, createBindDirective };
export { initialize } from './lib/reactivity';

// Export individual directives for custom registration
export { show, model, text };
export { 
    onClick, 
    onInput, 
    onChange, 
    onSubmit, 
    onFocus, 
    onBlur, 
    onMouseover, 
    onMouseout, 
    onKeydown, 
    onKeyup 
};
export { 
    bindClass, 
    bindStyle, 
    bindHref, 
    bindSrc, 
    bindAlt, 
    bindTitle, 
    bindDisabled, 
    bindHidden, 
    bindValue 
};
