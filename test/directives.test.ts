import { describe, it, expect, beforeEach } from 'vitest'
import { createComponent, triggerClick, triggerInput, cleanup, nextTick } from './utils'

describe('Directives', () => {
    beforeEach(cleanup)

    describe('z-text directive', () => {
        it('should set text content', () => {
            const { element } = createComponent(`
        <div z-state="{ message: 'Hello World' }">
          <span z-text="message"></span>
        </div>
      `)
      
            const span = element.querySelector('span')
            expect(span?.textContent).toBe('Hello World')
        })

        it('should update text when state changes', async () => {
            const { element } = createComponent(`
        <div z-state="{ message: 'Initial' }">
          <span z-text="message"></span>
          <button z-on:click="message = 'Updated'">Update</button>
        </div>
      `)
      
            const span = element.querySelector('span')
            const button = element.querySelector('button')
      
            expect(span?.textContent).toBe('Initial')
      
            triggerClick(button!)
            await nextTick()
      
            expect(span?.textContent).toBe('Updated')
        })

        it('should handle expressions', () => {
            const { element } = createComponent(`
        <div z-state="{ firstName: 'John', lastName: 'Doe' }">
          <span z-text="\`\${firstName} \${lastName}\`"></span>
        </div>
      `)
      
            const span = element.querySelector('span')
            expect(span?.textContent).toBe('John Doe')
        })

        it('should handle undefined/null values', () => {
            const { element } = createComponent(`
        <div z-state="{ value: null, undef: undefined }">
          <span id="null" z-text="value"></span>
          <span id="undef" z-text="undef"></span>
        </div>
      `)
      
            const nullSpan = element.querySelector('#null')
            const undefSpan = element.querySelector('#undef')
      
            expect(nullSpan?.textContent).toBe('')
            expect(undefSpan?.textContent).toBe('')
        })
    })

    describe('z-show directive', () => {
        it('should show/hide elements', () => {
            const { element } = createComponent(`
        <div z-state="{ visible: true }">
          <div z-show="visible">Content</div>
        </div>
      `)
      
            const div = element.querySelector('div[z-show]')
            expect(div?.style.display).toBe('')
        })

        it('should hide when condition is false', () => {
            const { element } = createComponent(`
        <div z-state="{ visible: false }">
          <div z-show="visible">Content</div>
        </div>
      `)
      
            const div = element.querySelector('div[z-show]')
            expect(div?.style.display).toBe('none')
        })

        it('should toggle visibility', async () => {
            const { element } = createComponent(`
        <div z-state="{ visible: true }">
          <div z-show="visible">Content</div>
          <button z-on:click="visible = !visible">Toggle</button>
        </div>
      `)
      
            const div = element.querySelector('div[z-show]')
            const button = element.querySelector('button')
      
            expect(div?.style.display).toBe('')
      
            triggerClick(button!)
            await nextTick()
      
            expect(div?.style.display).toBe('none')
      
            triggerClick(button!)
            await nextTick()
      
            expect(div?.style.display).toBe('')
        })
    })

    describe('z-on directive', () => {
        it('should handle click events', async () => {
            const { element } = createComponent(`
        <div z-state="{ count: 0 }">
          <button z-on:click="count++">Click me</button>
          <span z-text="count"></span>
        </div>
      `)
      
            const button = element.querySelector('button')
            const span = element.querySelector('span')
      
            expect(span?.textContent).toBe('0')
      
            triggerClick(button!)
            await nextTick()
      
            expect(span?.textContent).toBe('1')
        })

        it('should call methods', async () => {
            const { element } = createComponent(`
        <div z-state="{ 
          count: 0,
          increment() { this.count += 5; }
        }">
          <button z-on:click="increment()">Click me</button>
          <span z-text="count"></span>
        </div>
      `)
      
            const button = element.querySelector('button')
            const span = element.querySelector('span')
      
            expect(span?.textContent).toBe('0')
      
            triggerClick(button!)
            await nextTick()
      
            expect(span?.textContent).toBe('5')
        })

        it('should handle input events', async () => {
            const { element } = createComponent(`
        <div z-state="{ inputValue: '' }">
          <input z-on:input="inputValue = $event.target.value">
          <span z-text="inputValue"></span>
        </div>
      `)
      
            const input = element.querySelector('input') as HTMLInputElement
            const span = element.querySelector('span')
      
            expect(span?.textContent).toBe('')
      
            triggerInput(input, 'test value')
            await nextTick()
      
            expect(span?.textContent).toBe('test value')
        })
    })

    describe('z-model directive', () => {
        it('should create two-way binding for input', async () => {
            const { element } = createComponent(`
        <div z-state="{ name: 'John' }">
          <input z-model="name">
          <span z-text="name"></span>
        </div>
      `)
      
            const input = element.querySelector('input') as HTMLInputElement
            const span = element.querySelector('span')
      
            expect(input.value).toBe('John')
            expect(span?.textContent).toBe('John')
      
            triggerInput(input, 'Jane')
            await nextTick()
      
            expect(span?.textContent).toBe('Jane')
        })

        it('should handle checkbox binding', async () => {
            const { element } = createComponent(`
        <div z-state="{ checked: false }">
          <input type="checkbox" z-model="checked">
          <span z-text="checked"></span>
        </div>
      `)
      
            const input = element.querySelector('input') as HTMLInputElement
            const span = element.querySelector('span')
      
            expect(input.checked).toBe(false)
            expect(span?.textContent).toBe('false')
      
            input.checked = true
            input.dispatchEvent(new Event('change', { bubbles: true }))
            await nextTick()
      
            expect(span?.textContent).toBe('true')
        })

        it('should handle select binding', async () => {
            const { element } = createComponent(`
        <div z-state="{ country: 'us' }">
          <select z-model="country">
            <option value="us">USA</option>
            <option value="ca">Canada</option>
          </select>
          <span z-text="country"></span>
        </div>
      `)
      
            const select = element.querySelector('select') as HTMLSelectElement
            const span = element.querySelector('span')
      
            expect(select.value).toBe('us')
            expect(span?.textContent).toBe('us')
      
            select.value = 'ca'
            select.dispatchEvent(new Event('change'))
            await nextTick()
      
            expect(span?.textContent).toBe('ca')
        })
    })

    describe('z-bind directive', () => {
        it('should bind attributes', () => {
            const { element } = createComponent(`
        <div z-state="{ url: 'https://example.com', alt: 'Test image' }">
          <img z-bind:src="url" z-bind:alt="alt">
        </div>
      `)
      
            const img = element.querySelector('img')
            expect(img?.getAttribute('src')).toBe('https://example.com')
            expect(img?.getAttribute('alt')).toBe('Test image')
        })

        it('should bind classes with objects', () => {
            const { element } = createComponent(`
        <div z-state="{ isActive: true, isDisabled: false }">
          <div id="target" z-bind:class="{ active: isActive, disabled: isDisabled }"></div>
        </div>
      `)
      
            const div = element.querySelector('#target')
            expect(div?.classList.contains('active')).toBe(true)
            expect(div?.classList.contains('disabled')).toBe(false)
        })

        it('should bind styles with objects', () => {
            const { element } = createComponent(`
        <div z-state="{ color: 'red', fontSize: 16 }">
          <div id="target" z-bind:style="{ color: color, 'font-size': fontSize + 'px' }"></div>
        </div>
      `)
      
            const div = element.querySelector('#target') as HTMLElement;
            expect(div?.style.color).toBe('red')
            expect(div?.style.fontSize).toBe('16px')
        })

        it('should update bindings when state changes', async () => {
            const { element } = createComponent(`
        <div z-state="{ url: 'initial.jpg' }">
          <img z-bind:src="url">
          <button z-on:click="url = 'updated.jpg'">Update</button>
        </div>
      `)
      
            const img = element.querySelector('img')
            const button = element.querySelector('button')
      
            expect(img?.getAttribute('src')).toBe('initial.jpg')
      
            triggerClick(button!)
            await nextTick()
      
            expect(img?.getAttribute('src')).toBe('updated.jpg')
        })
    })

    describe('z-for directive', () => {
        it('should render lists', () => {
            const { element } = createComponent(`
        <div z-state="{ items: ['a', 'b', 'c'] }">
          <ul>
            <template z-for="item in items" z-key="item">
              <li z-text="item"></li>
            </template>
          </ul>
        </div>
      `)
      
            const items = element.querySelectorAll('li')
            expect(items).toHaveLength(3)
            expect(items[0].textContent).toBe('a')
            expect(items[1].textContent).toBe('b')
            expect(items[2].textContent).toBe('c')
        })

        it('should render with index', () => {
            const { element } = createComponent(`
        <div z-state="{ items: ['x', 'y'] }">
          <ul>
            <template z-for="(item, index) in items" z-key="index">
              <li z-text="\`\${index}: \${item}\`"></li>
            </template>
          </ul>
        </div>
      `)
      
            const items = element.querySelectorAll('li')
            expect(items).toHaveLength(2)
            expect(items[0].textContent).toBe('0: x')
            expect(items[1].textContent).toBe('1: y')
        })

        it('should update when array changes', async () => {
            const { element } = createComponent(`
        <div z-state="{ items: ['a'] }">
          <ul>
            <template z-for="item in items" z-key="item">
              <li z-text="item"></li>
            </template>
          </ul>
          <button z-on:click="items.push('b')">Add</button>
        </div>
      `)
      
            let items = element.querySelectorAll('li')
            expect(items).toHaveLength(1)
      
            const button = element.querySelector('button')
            triggerClick(button!)
            await nextTick()
      
            items = element.querySelectorAll('li')
            expect(items).toHaveLength(2)
            expect(items[1].textContent).toBe('b')
        })
    })

    describe('z-if directive', () => {
        it('should conditionally render elements', () => {
            const { element } = createComponent(`
        <div z-state="{ show: true }">
            <p z-if="show">Visible content</p>
        </div>
      `)
      
            const p = element.querySelector('p')
            expect(p?.textContent).toBe('Visible content')
        })

        it('should not render when condition is false', () => {
            const { element } = createComponent(`
        <div z-state="{ show: false }">
            <p z-if="show">Hidden content</p>
        </div>
      `)
      
            const p = element.querySelector('p')
            expect(p).toBeNull()
        })

        it('should toggle rendering', async () => {
            const { element } = createComponent(`
        <div z-state="{ show: false }">
            <p z-if="show">Toggle content</p>
          <button z-on:click="show = !show">Toggle</button>
        </div>
      `)
      
            let p = element.querySelector('p')
            expect(p).toBeNull()
      
            const button = element.querySelector('button')
            triggerClick(button!)
            await nextTick()
      
            p = element.querySelector('p')
            expect(p?.textContent).toBe('Toggle content')
      
            triggerClick(button!)
            await nextTick()
      
            p = element.querySelector('p')
            expect(p).toBeNull()
        })
    })
})
