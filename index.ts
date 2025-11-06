// Use the built package for development demos
import zust from './packages/zust/dist/index.mjs';

// Start the framework
zust.start();

// Export for debugging
declare global {
    interface Window {
        zust: typeof zust;
    }
}

window.zust = zust;