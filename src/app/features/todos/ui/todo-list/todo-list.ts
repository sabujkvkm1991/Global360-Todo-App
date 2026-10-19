import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { Todo } from '../../data-access/todo.model';

/** Presentational list of TODO items. Emits the id of an item the user wants removed. */
@Component({
  selector: 'app-todo-list',
  imports: [DatePipe],
  templateUrl: './todo-list.html',
  styleUrl: './todo-list.scss',
})
export class TodoList {
  readonly todos = input.required<readonly Todo[]>();
  readonly deletingIds = input<ReadonlySet<string>>(new Set());
  readonly remove = output<string>();
}
