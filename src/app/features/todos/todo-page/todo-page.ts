import { Component, computed, inject, OnInit, viewChild } from '@angular/core';
import { TodoStore } from '../data-access/todo-store';
import { TodoForm } from '../ui/todo-form/todo-form';
import { TodoList } from '../ui/todo-list/todo-list';

/** Container that connects the TODO store to the presentational components. */
@Component({
  selector: 'app-todo-page',
  imports: [TodoForm, TodoList],
  templateUrl: './todo-page.html',
  styleUrl: './todo-page.scss',
})
export class TodoPage implements OnInit {
  protected readonly store = inject(TodoStore);
  private readonly form = viewChild.required(TodoForm);

  protected readonly countLabel = computed(() => {
    const count = this.store.count();
    return `${count} ${count === 1 ? 'item' : 'items'}`;
  });

  ngOnInit(): void {
    void this.store.load();
  }

  protected async add(title: string): Promise<void> {
    if (await this.store.add(title)) {
      this.form().reset();
    }
  }

  protected remove(id: string): void {
    void this.store.remove(id);
  }
}
