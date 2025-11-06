import { describe, it, expect, beforeEach } from 'vitest'
import { createComponent, triggerClick, triggerInput, cleanup, nextTick, waitFor } from './utils'

describe('Integration Tests', () => {
    beforeEach(cleanup)

    describe('Parent-Child Communication', () => {
        it('should allow child to access parent state', () => {
            const { element } = createComponent(`
        <div z-state="{ parentValue: 'from parent' }">
          <div z-state="{ childValue: 'from child' }">
            <span id="parent" z-text="$parent.parentValue"></span>
            <span id="child" z-text="childValue"></span>
          </div>
        </div>
      `)
      
            const parentSpan = element.querySelector('#parent')
            const childSpan = element.querySelector('#child')
      
            expect(parentSpan?.textContent).toBe('from parent')
            expect(childSpan?.textContent).toBe('from child')
        })

        it('should allow child to modify parent state', async () => {
            const { element } = createComponent(`
        <div z-state="{ count: 0 }">
          <span id="parent-count" z-text="count"></span>
          <div z-state="{ localValue: 'child' }">
            <button z-on:click="$parent.count++">Increment Parent</button>
            <span id="child-sees" z-text="$parent.count"></span>
          </div>
        </div>
      `)
      
            const parentSpan = element.querySelector('#parent-count')
            const childSpan = element.querySelector('#child-sees')
            const button = element.querySelector('button')
      
            expect(parentSpan?.textContent).toBe('0')
            expect(childSpan?.textContent).toBe('0')
      
            triggerClick(button!)
            await nextTick()
      
            expect(parentSpan?.textContent).toBe('1')
            expect(childSpan?.textContent).toBe('1')
        })

        it('should support reactive state sharing', async () => {
            const { element } = createComponent(`
        <div z-state="{ sharedCounter: 0 }">
          <button id="parent-btn" z-on:click="sharedCounter++">Parent +1</button>
          <span id="parent-display" z-text="sharedCounter"></span>
          
          <div z-state="{ counter: $parent.sharedCounter }">
            <button id="child-btn" z-on:click="counter += 5">Child +5</button>
            <span id="child-display" z-text="counter"></span>
          </div>
        </div>
      `)
      
            const parentBtn = element.querySelector('#parent-btn')
            const childBtn = element.querySelector('#child-btn')
            const parentDisplay = element.querySelector('#parent-display')
            const childDisplay = element.querySelector('#child-display')
      
            expect(parentDisplay?.textContent).toBe('0')
            expect(childDisplay?.textContent).toBe('0')
      
            // Parent increments
            triggerClick(parentBtn!)
            await nextTick()
      
            expect(parentDisplay?.textContent).toBe('1')
            expect(childDisplay?.textContent).toBe('1')
      
            // Child increments (should affect parent too)
            triggerClick(childBtn!)
            await nextTick()
      
            expect(parentDisplay?.textContent).toBe('6')
            expect(childDisplay?.textContent).toBe('6')
        })
    })

    describe('Complex State Management', () => {
        it('should handle complex nested state', async () => {
            const { element } = createComponent(`
        <div z-state="{
          user: { 
            profile: { name: 'John', age: 30 },
            settings: { theme: 'light', notifications: true }
          },
          updateProfile(name, age) {
            this.user.profile.name = name;
            this.user.profile.age = age;
          }
        }">
          <div>
            <span id="name" z-text="user.profile.name"></span>
            <span id="age" z-text="user.profile.age"></span>
            <span id="theme" z-text="user.settings.theme"></span>
          </div>
          <button z-on:click="updateProfile('Jane', 25)">Update</button>
          <button z-on:click="user.settings.theme = 'dark'">Dark Theme</button>
        </div>
      `)
      
            const nameSpan = element.querySelector('#name')
            const ageSpan = element.querySelector('#age')
            const themeSpan = element.querySelector('#theme')
            const updateBtn = element.querySelector('button:first-of-type')
            const themeBtn = element.querySelector('button:last-of-type')
      
            expect(nameSpan?.textContent).toBe('John')
            expect(ageSpan?.textContent).toBe('30')
            expect(themeSpan?.textContent).toBe('light')
      
            triggerClick(updateBtn!)
            await nextTick()
      
            expect(nameSpan?.textContent).toBe('Jane')
            expect(ageSpan?.textContent).toBe('25')
      
            triggerClick(themeBtn!)
            await nextTick()
      
            expect(themeSpan?.textContent).toBe('dark')
        })

        it('should handle arrays and loops together', async () => {
            const { element } = createComponent(`
        <div z-state="{
          todos: [
            { id: 1, text: 'Task 1', done: false },
            { id: 2, text: 'Task 2', done: true }
          ],
          addTodo() {
            this.todos.push({ 
              id: Date.now(), 
              text: 'New Task', 
              done: false 
            });
          },
          toggleTodo(id) {
            const todo = this.todos.find(t => t.id === id);
            if (todo) todo.done = !todo.done;
          }
        }">
          <ul>
            <template z-for="todo in todos" z-key="todo.id">
              <li>
                <span z-text="todo.text"></span>
                <span z-text="todo.done ? ' (done)' : ' (pending)'"></span>
                <button z-on:click="toggleTodo(todo.id)">Toggle</button>
              </li>
            </template>
          </ul>
          <button id="add" z-on:click="addTodo()">Add Todo</button>
        </div>
      `)
      
            let items = element.querySelectorAll('li')
            expect(items).toHaveLength(2)
            expect(items[0].textContent).toContain('Task 1')
            expect(items[0].textContent).toContain('(pending)')
            expect(items[1].textContent).toContain('Task 2')
            expect(items[1].textContent).toContain('(done)')
      
            // Toggle first todo
            const toggleBtn = items[0].querySelector('button')
            triggerClick(toggleBtn!)
            await nextTick()
      
            items = element.querySelectorAll('li')
            expect(items[0].textContent).toContain('(done)')
      
            // Add new todo
            const addBtn = element.querySelector('#add')
            triggerClick(addBtn!)
            await nextTick()
      
            items = element.querySelectorAll('li')
            expect(items).toHaveLength(3)
            expect(items[2].textContent).toContain('New Task')
        })
    })

    describe('Real-world Scenarios', () => {
        it('should handle a todo app', async () => {
            const { element } = createComponent(`
        <div z-state="{
          todos: [],
          newTodo: '',
          filter: 'all',
          
          filteredTodos() {
            if (this.filter === 'completed') return this.todos.filter(t => t.completed);
            if (this.filter === 'active') return this.todos.filter(t => !t.completed);
            return this.todos;
          },
          
          completedCount() {
            return this.todos.filter(t => t.completed).length;
          },
          
          addTodo() {
            if (this.newTodo.trim()) {
              this.todos.push({
                id: Date.now(),
                text: this.newTodo.trim(),
                completed: false
              });
              this.newTodo = '';
            }
          },
          
          toggleTodo(id) {
            const todo = this.todos.find(t => t.id === id);
            if (todo) todo.completed = !todo.completed;
          },
          
          removeTodo(id) {
            const index = this.todos.findIndex(t => t.id === id);
            if (index > -1) this.todos.splice(index, 1);
          }
        }">
          <!-- Add new todo -->
          <div>
            <form z-on:submit="addTodo()">
                <input z-model="newTodo" placeholder="What needs to be done?" >
                <button id="addButton" z-on:click="addTodo()">Add</button>
            </form>
          </div>
          
          <!-- Filter buttons -->
          <div>
            <button id="filter-all" z-on:click="filter = 'all'" 
                    z-bind:class="{ active: filter === 'all' }">All</button>
            <button id="filter-active" z-on:click="filter = 'active'"
                    z-bind:class="{ active: filter === 'active' }">Active</button>
            <button id="filter-completed" z-on:click="filter = 'completed'"
                    z-bind:class="{ active: filter === 'completed' }">Completed</button>
          </div>
          
          <!-- Todo list -->
          <ul id="todos">
            <template z-for="todo in filteredTodos()" z-key="todo.id">
              <li z-bind:class="{ completed: todo.completed }">
                <input type="checkbox" z-model="todo.completed">
                <span z-text="todo.text"></span>
                <button z-on:click="removeTodo(todo.id)">×</button>
              </li>
            </template>
          </ul>
          
          <!-- Stats -->
          <div>
            <span z-text="\`\${completedCount()} of \${todos.length} completed\`"></span>
          </div>
        </div>
      `)
      
            const input = element.querySelector('input[placeholder]') as HTMLInputElement
            const addBtn = element.querySelector('#addButton')
            const statsSpan = element.querySelector('div:last-child span')
      
            // Initial state
            expect(statsSpan?.textContent).toBe('0 of 0 completed')
      
            // Add first todo
            triggerInput(input, 'First task')
            triggerClick(addBtn!)
            await nextTick()
      
            let todos = element.querySelectorAll('li')
            expect(todos).toHaveLength(1)
            expect(todos[0].textContent).toContain('First task')
            expect(statsSpan?.textContent).toBe('0 of 1 completed')
      
            // Add second todo
            triggerInput(input, 'Second task')
            triggerClick(addBtn!)
            await nextTick()
      
            todos = element.querySelectorAll('li')
            expect(todos).toHaveLength(2)
            expect(statsSpan?.textContent).toBe('0 of 2 completed')
      
            // Complete first todo
            const checkbox = todos[0].querySelector('input[type="checkbox"]') as HTMLInputElement
            checkbox.checked = true
            checkbox.dispatchEvent(new Event('change'))
            await nextTick()
      
            expect(statsSpan?.textContent).toBe('1 of 2 completed')
      
            // Filter to completed
            const completedBtn = element.querySelector('#filter-completed')
            triggerClick(completedBtn!)
            await nextTick()
      
            todos = element.querySelectorAll('li')
            expect(todos).toHaveLength(1)
            expect(todos[0].textContent).toContain('First task')
      
            // Filter to active
            const activeBtn = element.querySelector('#filter-active')
            triggerClick(activeBtn!)
            await nextTick()
      
            todos = element.querySelectorAll('li')
            expect(todos).toHaveLength(1)
            expect(todos[0].textContent).toContain('Second task')
        })

        it('should handle form validation', async () => {
            const { element } = createComponent(`
                <div z-state="{
                    form: { name: '', age: '', email: '' },
                    errors: { name: null, age: null, email: null },
                    validate(field) {
                        if (!this.form[field]) {
                            return;
                        }

                        this.errors[field] = null;
                        
                        switch(field) {
                            case 'name':
                                if (!this.form.name) {
                                    this.errors.name = 'Name is required';
                                } 
                                break;
                            case 'age':
                                if (!this.form.age) {
                                    this.errors.age = 'Age is required';
                                } else if (this.form.age < 13) {
                                    this.errors.age = 'Children should not be here';
                                } 
                                break;
                            case 'email':
                                if (!this.form.email || !this.form.email.includes('@')) {
                                    this.errors.email = 'Email is not a valid email address';
                                } 
                                break;
                        
                        };
                    },
                    isValid() {
                        return !this.errors.name && !this.errors.age && !this.errors.email && this.form.name && this.form.email && this.form.age;
                    },
                }">
                    <form>
                        <div>
                            <input z-model="form.email" z-on:blur="validate('email')" id="email" />
                            <div id="errors-email" z-text="errors.email ?? ''"></div> 
                        </div>

                        <div>
                            <input z-model="form.name" z-on:blur="validate('name')" id="name" />
                            <div id="errors-name" z-text="errors.name ?? ''"></div> 
                        </div>

                        <div>
                            <input z-model="form.age" z-on:blur="validate('age')" id="age" />
                            <div id="errors-age" z-text="errors.age ?? ''"></div> 
                        </div>

                        <button id="submit" z-bind:disabled="!isValid()">Submit</button>
                        
                    </form>
                </div>
            `);

            const nameInput = element.querySelector('#name');
            const emailInput = element.querySelector('#email');
            const ageInput = element.querySelector('#age');

            const nameError = element.querySelector('#errors-name');
            const emailError = element.querySelector('#errors-email');
            const ageError = element.querySelector('#errors-age');

            const submitBtn = element.querySelector('#submit');

            expect(nameError?.textContent).toBe('');
            expect(ageError?.textContent).toBe('');
            expect(emailError?.textContent).toBe('');

            triggerInput(nameInput!, 'Yo');
            nameInput?.dispatchEvent(new Event('blur'));
            await nextTick();

            expect(nameError?.textContent).toBe('');

            triggerInput(emailInput, 'test');
            emailInput?.dispatchEvent(new Event('blur'));
            await nextTick();

            expect(emailError?.textContent).toBe('Email is not a valid email address');
            expect(submitBtn?.disabled).toBe(true);

            triggerInput(ageInput, '10');
            ageInput?.dispatchEvent(new Event('blur'));
            await nextTick();

            expect(ageError?.textContent).toBe('Children should not be here');
            expect(submitBtn?.disabled).toBe(true);


            triggerInput(emailInput, 'test@test.com');
            emailInput?.dispatchEvent(new Event('blur'));
            await nextTick();

            expect(emailError?.textContent).toBe(''); // Now we have given valid email address
            expect(submitBtn?.disabled).toBe(true);


            triggerInput(ageInput, '20');
            ageInput?.dispatchEvent(new Event('blur'));
            await nextTick();

            expect(ageError?.textContent).toBe('');
            expect(submitBtn?.disabled).toBe(false);
        });
    })

    describe('Performance and Edge Cases', () => {
        it('should handle rapid state updates efficiently', async () => {
            const { element } = createComponent(`
                <div z-state="{ counter: 0, onClick() { for(let i = 0; i < 100; i++ ) { this.counter++; }} }">
                  <span z-text="counter"></span>
                  <button z-on:click="onClick()">
                    Rapid Updates
                  </button>
                </div>
              `)
      
            const span = element.querySelector('span')
            const button = element.querySelector('button')
      
            expect(span?.textContent).toBe('0')
      
            triggerClick(button!)
            await nextTick()
      
            // Should batch all updates and show final result
            expect(span?.textContent).toBe('100')
        })

        it('should handle deeply nested state changes', async () => {
            const { element } = createComponent(`
        <div z-state="{
          deep: {
            level1: {
              level2: {
                level3: { value: 'initial' }
              }
            }
          }
        }">
          <span z-text="deep.level1.level2.level3.value"></span>
          <button z-on:click="deep.level1.level2.level3.value = 'updated'">
            Update Deep
          </button>
        </div>
      `)
      
            const span = element.querySelector('span')
            const button = element.querySelector('button')
      
            expect(span?.textContent).toBe('initial')
      
            triggerClick(button!)
            await nextTick()
      
            expect(span?.textContent).toBe('updated')
        })

        it('should handle circular references gracefully', () => {
            // This should not crash the framework
            const { element } = createComponent(`
        <div z-state="{
          a: { value: 1 },
          b: { value: 2 },
          init() {
            this.a.ref = this.b;
            this.b.ref = this.a;
          }
        }">
          <span z-text="a.value"></span>
          <span z-text="b.value"></span>
        </div>
      `)
      
            const spans = element.querySelectorAll('span')
            expect(spans[0].textContent).toBe('1')
            expect(spans[1].textContent).toBe('2')
        })
    })
})
