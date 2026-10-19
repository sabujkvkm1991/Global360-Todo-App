import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'TODO list',
    loadComponent: () => import('./features/todos/todo-page/todo-page').then((m) => m.TodoPage),
  },
  { path: '**', redirectTo: '' },
];
