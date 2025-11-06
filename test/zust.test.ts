import { describe, it, expect, beforeEach } from 'vitest'
import { Zust } from '../packages/zust/src/zust'
import { cleanup, nextTick, createTestZust } from './utils'

describe('Zust Framework Core', () => {
  beforeEach(cleanup)

  describe('Zust instantiation', () => {
    it('should create instance with default prefix', () => {
      const zust = new Zust()
      expect(zust.prefix).toBe('z')
    })

    it('should create instance with custom prefix', () => {
      const zust = new Zust('app')
      expect(zust.prefix).toBe('app')
    })

    it('should register custom directives', () => {
      const zust = new Zust()
      let called = false
      
      zust.directive('test', (element, value, context) => {
        called = true
      })
      
      document.body.innerHTML = `
        <div z-state="{ value: 'test' }">
          <span z-test="value"></span>
        </div>
      `
      
      zust.start()
      
      expect(called).toBe(true)
    })

    it('should handle directive priorities', () => {
      const zust = new Zust()
      const callOrder: string[] = []
      
      zust.directive('priority-low', () => { callOrder.push('low') }, 10)
      zust.directive('priority-high', () => { callOrder.push('high') }, 100)
      zust.directive('priority-medium', () => { callOrder.push('medium') }, 50)
      
      document.body.innerHTML = `
        <div z-state="{ value: 'test' }">
          <span z-priority-low="value" z-priority-high="value" z-priority-medium="value"></span>
        </div>
      `
      
      zust.start()
      
      expect(callOrder).toEqual(['high', 'medium', 'low'])
    })
  })

  describe('Component lifecycle', () => {
    it('should initialize components when start() is called', () => {
      const zust = createTestZust()
      
      document.body.innerHTML = `
        <div z-state="{ message: 'hello' }">
          <span z-text="message"></span>
        </div>
      `
      
      // Before start, no processing should happen
      let span = document.querySelector('span')
      expect(span?.textContent).toBe('')
      
      zust.start()
      
      // After start, directive should be processed
      span = document.querySelector('span')
      expect(span?.textContent).toBe('hello')
    })

    it('should handle dynamically added components', async () => {
      const zust = new Zust()
      zust.start()
      
      // Add component after zust has started
      const newDiv = document.createElement('div')
      newDiv.setAttribute('z-state', '{ message: "dynamic" }')
      newDiv.innerHTML = '<span z-text="message"></span>'
      document.body.appendChild(newDiv)
      
      await nextTick()
      
      const span = newDiv.querySelector('span')
      expect(span?.textContent).toBe('dynamic')
    })

    it('should call init method after component initialization', async () => {
      const zust = new Zust()
      let initCalled = false
      
      // We need to make init globally accessible for this test
      ;(window as any).testInit = () => { initCalled = true }
      
      document.body.innerHTML = `
        <div z-state="{ 
          value: 'test',
          init() { window.testInit(); }
        }">
          <span z-text="value"></span>
        </div>
      `
      
      zust.start()
      
      // Init should be called after initial render
      await nextTick()
      expect(initCalled).toBe(true)
      
      // Cleanup
      delete (window as any).testInit
    })

    it('should provide component context', () => {
      const zust = new Zust()
      let capturedContext: any = null
      
      zust.directive('test-capture', (element, value, context) => {
        capturedContext = context
      })
      
      document.body.innerHTML = `
        <div z-state="{ test: 'value' }">
          <span z-test-capture="test"></span>
        </div>
      `
      
      zust.start()
      
      expect(capturedContext).toBeTruthy()
      expect(capturedContext.store).toBeTruthy()
      expect(capturedContext.setStore).toBeTruthy()
      expect(capturedContext.element).toBeTruthy()
      expect(capturedContext.evaluate).toBeTruthy()
      expect(capturedContext.zustInstance).toBe(zust)
    })
  })

  describe('Expression evaluation', () => {
    it('should evaluate simple expressions', () => {
      const zust = new Zust()
      let context: any = null
      
      zust.directive('test-eval', (element, value, ctx) => {
        context = ctx
      })
      
      document.body.innerHTML = `
        <div z-state="{ x: 5, y: 10 }">
          <span z-test-eval="x + y"></span>
        </div>
      `
      
      zust.start()
      
      expect(context.evaluate('x + y')).toBe(15)
      expect(context.evaluate('x * y')).toBe(50)
      expect(context.evaluate('x > y')).toBe(false)
    })

    it('should handle method calls in expressions', () => {
      const zust = new Zust()
      let context: any = null
      
      zust.directive('test-methods', (element, value, ctx) => {
        context = ctx
      })
      
      document.body.innerHTML = `
        <div z-state="{ 
          x: 5,
          double(n) { return n * 2; }
        }">
          <span z-test-methods="double(x)"></span>
        </div>
      `
      
      zust.start()
      
      expect(context.evaluate('double(x)')).toBe(10)
      expect(context.evaluate('double(double(x))')).toBe(20)
    })

    it('should handle template literals', () => {
      const zust = new Zust()
      let context: any = null
      
      zust.directive('test-template', (element, value, ctx) => {
        context = ctx
      })
      
      document.body.innerHTML = `
        <div z-state="{ name: 'John', age: 30 }">
          <span z-test-template="\`\${name} is \${age} years old\`"></span>
        </div>
      `
      
      zust.start()
      
      expect(context.evaluate('`${name} is ${age} years old`')).toBe('John is 30 years old')
    })

    it('should handle additional parameters in evaluation', () => {
      const zust = new Zust()
      let context: any = null
      
      zust.directive('test-params', (element, value, ctx) => {
        context = ctx
      })
      
      document.body.innerHTML = `
        <div z-state="{ multiplier: 2 }">
          <span z-test-params="multiplier * extra"></span>
        </div>
      `
      
      zust.start()
      
      expect(context.evaluate('multiplier * extra', { extra: 5 })).toBe(10)
    })

    it('should handle evaluation errors gracefully', () => {
      const zust = new Zust()
      let context: any = null
      
      // Spy on console.error to check if error was logged
      const originalConsoleError = console.error
      let errorLogged = false
      console.error = () => { errorLogged = true }
      
      zust.directive('test-errors', (element, value, ctx) => {
        context = ctx
      })
      
      document.body.innerHTML = `
        <div z-state="{ x: 5 }">
          <span z-test-errors="nonexistent.property"></span>
        </div>
      `
      
      zust.start()
      
      expect(context.evaluate('nonexistent.property')).toBeUndefined()
      expect(errorLogged).toBe(true)
      
      // Restore console.error
      console.error = originalConsoleError
    })
  })

  describe('Parent-child relationships', () => {
    it('should establish parent-child context relationships', () => {
      const zust = new Zust()
      let childContext: any = null
      let parentContext: any = null
      
      zust.directive('test-capture-parent', (element, value, ctx) => {
        parentContext = ctx
      })
      
      zust.directive('test-capture-child', (element, value, ctx) => {
        childContext = ctx
      })
      
      document.body.innerHTML = `
        <div z-state="{ parentValue: 'parent' }">
          <span z-test-capture-parent="parentValue"></span>
          <div z-state="{ childValue: 'child' }">
            <span z-test-capture-child="childValue"></span>
          </div>
        </div>
      `
      
      zust.start()
      
      expect(parentContext.parent).toBeUndefined()
      expect(childContext.parent).toBe(parentContext)
    })

    it('should allow child to access parent store', () => {
      const zust = new Zust()
      let childContext: any = null
      
      zust.directive('test-parent-access', (element, value, ctx) => {
        childContext = ctx
      })
      
      document.body.innerHTML = `
        <div z-state="{ parentValue: 'from parent' }">
          <div z-state="{ childValue: 'from child' }">
            <span z-test-parent-access="$parent.parentValue"></span>
          </div>
        </div>
      `
      
      zust.start()
      
      expect(childContext.evaluate('$parent.parentValue')).toBe('from parent')
      expect(childContext.evaluate('childValue')).toBe('from child')
    })

    it('should handle $parent in complex expressions', () => {
      const zust = new Zust()
      let childContext: any = null
      
      zust.directive('test-complex', (element, value, ctx) => {
        childContext = ctx
      })
      
      document.body.innerHTML = `
        <div z-state="{ count: 5, multiplier: 3 }">
          <div z-state="{ localValue: 2 }">
            <span z-test-complex="$parent.count * $parent.multiplier + localValue"></span>
          </div>
        </div>
      `
      
      zust.start()
      
      expect(childContext.evaluate('$parent.count * $parent.multiplier + localValue')).toBe(17)
    })
  })

  describe('Cleanup and destruction', () => {
    it('should provide cleanup mechanism', () => {
      const zust = new Zust()
      
      document.body.innerHTML = `
        <div z-state="{ value: 'test' }">
          <span z-text="value"></span>
        </div>
      `
      
      zust.start()
      
      // Should not throw when destroying
      expect(() => zust.destroy()).not.toThrow()
    })

    it('should stop observing DOM changes after destroy', () => {
      const zust = new Zust()
      zust.start()
      zust.destroy()
      
      // Add new component after destroy - should not be processed
      document.body.innerHTML = `
        <div z-state="{ message: 'test' }">
          <span z-text="message"></span>
        </div>
      `
      
      const span = document.querySelector('span')
      expect(span?.textContent).toBe('')
    })
  })

  describe('Error handling', () => {
    it('should handle malformed state gracefully', () => {
      const zust = new Zust()
      
      // Spy on console.error
      const originalConsoleError = console.error
      let errorLogged = false
      console.error = () => { errorLogged = true }
      
      document.body.innerHTML = `
        <div z-state="{ invalid: syntax }">
          <span z-text="invalid"></span>
        </div>
      `
      
      expect(() => zust.start()).not.toThrow()
      expect(errorLogged).toBe(true)
      
      // Restore console.error
      console.error = originalConsoleError
    })

    it('should handle missing directive handlers', () => {
      const zust = new Zust()
      
      // Spy on console.warn
      const originalConsoleWarn = console.warn
      let warnLogged = false
      console.warn = () => { warnLogged = true }
      
      document.body.innerHTML = `
        <div z-state="{ value: 'test' }">
          <span z-nonexistent="value"></span>
        </div>
      `
      
      expect(() => zust.start()).not.toThrow()
      expect(warnLogged).toBe(true)
      
      // Restore console.warn
      console.warn = originalConsoleWarn
    })

    it('should handle directive execution errors', () => {
      const zust = new Zust()
      
      // Register a directive that throws
      zust.directive('error', () => {
        throw new Error('Test error')
      })
      
      // Spy on console.error
      const originalConsoleError = console.error
      let errorLogged = false
      console.error = () => { errorLogged = true }
      
      document.body.innerHTML = `
        <div z-state="{ value: 'test' }">
          <span z-error="value"></span>
        </div>
      `
      
      expect(() => zust.start()).not.toThrow()
      expect(errorLogged).toBe(true)
      
      // Restore console.error
      console.error = originalConsoleError
    })
  })
})