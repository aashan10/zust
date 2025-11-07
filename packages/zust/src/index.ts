// Export core framework
export { Zust } from './zust';
export type { DirectiveHandler, ComponentContext } from './zust';

// Export built-in directives for advanced users
export { text } from './directives/text';
export { show } from './directives/show';
export { createBindDirective, bindValue, bindClass, bindStyle } from './directives/bind';
export { createOnDirective, clickOutside } from './directives/on';
export { model } from './directives/model';
export { forDirective } from './directives/for';
export { lazy } from './directives/lazy';
export { intersectVisible, intersectInvisible } from './directives/intersect';

// Export reactivity system
export { initialize } from './reactivity';

// Create and export default instance with all built-in directives pre-registered
import { Zust } from './zust';

const zust = new Zust('z');

export default zust;
