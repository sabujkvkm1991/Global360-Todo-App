import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Todo } from '../../data-access/todo.model';
import { TodoList } from './todo-list';

describe('TodoList', () => {
  const todos: Todo[] = [
    { id: '1', title: 'Buy milk', createdAt: '2026-01-01T09:00:00Z' },
    { id: '2', title: 'Walk dog', createdAt: '2026-01-02T09:00:00Z' },
  ];

  let fixture: ComponentFixture<TodoList>;
  let element: HTMLElement;

  const items = () => Array.from(element.querySelectorAll('li'));
  const deleteButton = (title: string) =>
    element.querySelector<HTMLButtonElement>(`button[aria-label="Delete ${title}"]`)!;

  beforeEach(async () => {
    fixture = TestBed.createComponent(TodoList);
    element = fixture.nativeElement;
    fixture.componentRef.setInput('todos', todos);
    await fixture.whenStable();
  });

  it('renders each todo', () => {
    expect(items().map((li) => li.querySelector('span')!.textContent!.trim())).toEqual([
      'Buy milk',
      'Walk dog',
    ]);
  });

  it('shows when each todo was added', () => {
    const time = element.querySelector('li time')!;

    expect(time.getAttribute('datetime')).toBe(todos[0].createdAt);
    expect(time.textContent!.trim()).toMatch(/^Jan \d{1,2}, \d{1,2}:\d{2} [AP]M$/);
  });

  it('shows an empty state when there are no todos', async () => {
    fixture.componentRef.setInput('todos', []);
    await fixture.whenStable();

    expect(items()).toHaveLength(0);
    expect(element.textContent).toContain('Nothing to do yet');
  });

  it('emits the id when delete is clicked', () => {
    const removed: string[] = [];
    fixture.componentInstance.remove.subscribe((id) => removed.push(id));

    deleteButton('Walk dog').click();

    expect(removed).toEqual(['2']);
  });

  it('disables the delete button of items being deleted', async () => {
    fixture.componentRef.setInput('deletingIds', new Set(['1']));
    await fixture.whenStable();

    expect(deleteButton('Buy milk').disabled).toBe(true);
    expect(deleteButton('Buy milk').textContent).toContain('Deleting');
    expect(deleteButton('Walk dog').disabled).toBe(false);
  });
});
