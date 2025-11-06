// Global test setup
import { beforeEach, afterEach } from 'vitest'

// Clean up DOM before each test
beforeEach(() => {
  document.body.innerHTML = ''
  document.head.innerHTML = ''
})

// Clean up any remaining timers after each test
afterEach(() => {
  // Clear any running timers that might interfere with tests
  setTimeout(() => {}, 0)
})

// Add custom DOM matchers if needed
declare global {
  interface Window {
    zust: any
  }
}