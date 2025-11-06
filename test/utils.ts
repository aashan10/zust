import { Zust } from '../packages/zust/src/zust'
import zust from '../packages/zust/src/index'

/**
 * Test utilities for Zust framework
 */

/**
 * Create a clean DOM element for testing
 */
export function createTestElement(html: string): HTMLElement {
  const container = document.createElement('div')
  container.innerHTML = html
  document.body.appendChild(container)
  return container.firstElementChild as HTMLElement
}

/**
 * Create a Zust instance for testing with optional prefix
 * Uses the default instance with all built-in directives when prefix is 'z'
 */
export function createTestZust(prefix = 'z'): Zust {
  if (prefix === 'z') {
    return zust // Use the default instance with all directives
  }
  return new Zust(prefix)
}

/**
 * Wait for next tick (useful for async operations)
 */
export function nextTick(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * Wait for multiple ticks
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Simulate DOM events
 */
export function triggerEvent(element: HTMLElement, eventType: string, eventData: any = {}): void {
  const event = new Event(eventType, { bubbles: true, cancelable: true })
  Object.assign(event, eventData)
  element.dispatchEvent(event)
}

/**
 * Simulate input events with value
 */
export function triggerInput(element: HTMLInputElement, value: string): void {
  element.value = value
  const event = new Event('input', { bubbles: true })
  element.dispatchEvent(event)
}

/**
 * Simulate click events
 */
export function triggerClick(element: HTMLElement): void {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true })
  element.dispatchEvent(event)
}

/**
 * Create a component with state and return both element and context
 */
export function createComponent(html: string, zust?: Zust): { element: HTMLElement, zust: Zust } {
  const testZust = zust || createTestZust()
  const element = createTestElement(html)
  testZust.start()
  return { element, zust: testZust }
}

/**
 * Clean up DOM after test
 */
export function cleanup(): void {
  document.body.innerHTML = ''
}