import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TODO_TITLE_MAX_LENGTH } from '../../data-access/todo.model';
import { TodoForm } from './todo-form';

describe('TodoForm', () => {
  let fixture: ComponentFixture<TodoForm>;
  let element: HTMLElement;
  let emitted: string[];

  const input = () => element.querySelector<HTMLInputElement>('input')!;
  const button = () => element.querySelector<HTMLButtonElement>('button')!;
  const error = () => element.querySelector('[role="alert"]')!.textContent!.trim();

  async function type(value: string): Promise<void> {
    input().value = value;
    input().dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function submit(): Promise<void> {
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    fixture = TestBed.createComponent(TodoForm);
    element = fixture.nativeElement;
    emitted = [];
    fixture.componentInstance.submitted.subscribe((title) => emitted.push(title));
    await fixture.whenStable();
  });

  it('emits the trimmed title on submit', async () => {
    await type('  Buy milk ');
    await submit();

    expect(emitted).toEqual(['Buy milk']);
  });

  it('does not emit and shows an error when the title is blank', async () => {
    await type('   ');
    await submit();

    expect(emitted).toEqual([]);
    expect(error()).toContain('Please enter a description');
    expect(input().getAttribute('aria-invalid')).toBe('true');
  });

  it('does not emit when the title is too long', async () => {
    await type('x'.repeat(TODO_TITLE_MAX_LENGTH + 1));
    await submit();

    expect(emitted).toEqual([]);
    expect(error()).toContain(`${TODO_TITLE_MAX_LENGTH} characters`);
  });

  it('disables submitting while busy', async () => {
    fixture.componentRef.setInput('busy', true);
    await type('Buy milk');
    await submit();

    expect(button().disabled).toBe(true);
    expect(button().textContent).toContain('Adding');
    expect(emitted).toEqual([]);
  });

  it('clears the input on reset', async () => {
    await type('Buy milk');

    fixture.componentInstance.reset();
    await fixture.whenStable();

    expect(input().value).toBe('');
    expect(error()).toBe('');
  });
});
