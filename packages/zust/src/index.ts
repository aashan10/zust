// Export core framework
export { Zust } from './zust';
export type { DirectiveHandler, ComponentContext } from './zust';

// Export built-in directives
export { text } from './directives/text';
export { show } from './directives/show';
export { createBindDirective, bindValue, bindClass, bindStyle } from './directives/bind';
export { createOnDirective, onClick, onInput, onChange, onSubmit, onFocus, onBlur, onMouseover, onMouseout, onKeydown, onKeyup } from './directives/on';
export { model } from './directives/model';
export { forDirective } from './directives/for';
export { lazy } from './directives/lazy';
export { createIntersectDirective, intersectVisible, intersectInvisible } from './directives/intersect';

// Export reactivity system
export { initialize } from './reactivity';

// Create and export default instance
import { Zust } from './zust';
import { text } from './directives/text';
import { show } from './directives/show';
import { createBindDirective, bindValue, bindClass, bindStyle, bindSrc, bindAlt, bindHref, bindTitle, bindHidden, bindDisabled } from './directives/bind';
import {
    clickOutside,
    createOnDirective, onClick, onInput, onChange, onSubmit, onFocus, onBlur, onMouseover, onMouseout, onKeydown, onKeyup } from './directives/on';
import { model } from './directives/model';
import { forDirective } from './directives/for';
import { lazy } from './directives/lazy';
import { intersectVisible, intersectInvisible } from './directives/intersect';

// Create default instance with all built-in directives
const zust = new Zust('z');

// Register all built-in directives
zust.directive('text', text);
zust.directive('show', show);
zust.directive('model', model);
zust.directive('for', forDirective, 1000);
zust.directive('lazy', lazy, 50);

const bindingTypes = {
    value: bindValue,
    class: bindClass,
    style: bindStyle,
    href: bindHref,
    hidden: bindHidden,
    alt: bindAlt,
    title: bindTitle,
    disabled: bindDisabled,
    src: bindSrc,
};

Object.keys(bindingTypes).map(t => {
    const d = bindingTypes[t];
    zust.directive(`bind:${t}`, d, 50);
});

// Bind directives
zust.directive('bind', createBindDirective(''), 50);
zust.directive('bind:value', bindValue, 50);
zust.directive('bind:class', bindClass, 50);
zust.directive('bind:style', bindStyle, 50);

// Event directives
const eventTypes = ['click', 'input', 'change', 'submit', 'focus', 'blur', 'mouseenter', 'mouseleave', 'mouseover', 'mouseout', 'keydown', 'keyup'];
eventTypes.forEach(eventType => {
    zust.directive(`on:${eventType}`, createOnDirective(eventType), 50);
});

zust.directive('on:click-outside', clickOutside, 50);

// Intersection observer directives
zust.directive('intersect:visible', intersectVisible, 50);
zust.directive('intersect:invisible', intersectInvisible, 50);

export { zust as default };
