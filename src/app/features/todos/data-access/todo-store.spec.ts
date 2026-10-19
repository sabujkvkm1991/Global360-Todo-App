import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { TodoApi } from './todo-api';
import { TodoStore } from './todo-store';
import { Todo } from './todo.model';

describe('TodoStore', () => {
  const milk: Todo = { id: '1', title: 'Buy milk', createdAt: '2026-01-01T09:00:00Z' };
  const dog: Todo = { id: '2', title: 'Walk dog', createdAt: '2026-01-02T09:00:00Z' };

  let api: {
    getAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let store: TodoStore;

  beforeEach(() => {
    api = { getAll: vi.fn(), create: vi.fn(), delete: vi.fn() };
    TestBed.configureTestingModule({ providers: [{ provide: TodoApi, useValue: api }] });
    store = TestBed.inject(TodoStore);
  });

  describe('load', () => {
    it('populates todos from the api', async () => {
      api.getAll.mockReturnValue(of([milk, dog]));

      await store.load();

      expect(store.todos()).toEqual([dog, milk]);
      expect(store.count()).toBe(2);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('sorts todos by the date they were added, most recent first', async () => {
      const earliest: Todo = { id: '3', title: 'Earliest', createdAt: '2025-12-31T23:59:59Z' };
      api.getAll.mockReturnValue(of([milk, earliest, dog]));

      await store.load();

      expect(store.todos()).toEqual([dog, milk, earliest]);
    });

    it('sets loading while the request is in flight', async () => {
      const response = new Subject<Todo[]>();
      api.getAll.mockReturnValue(response);

      const pending = store.load();
      expect(store.loading()).toBe(true);

      response.next([milk]);
      response.complete();
      await pending;
      expect(store.loading()).toBe(false);
    });

    it('sets an error when the request fails', async () => {
      api.getAll.mockReturnValue(throwError(() => new Error('network')));

      await store.load();

      expect(store.todos()).toEqual([]);
      expect(store.error()).toContain('Could not load');
      expect(store.loading()).toBe(false);
    });
  });

  describe('add', () => {
    it('sends the trimmed title and shows the created todo first', async () => {
      api.getAll.mockReturnValue(of([milk]));
      api.create.mockReturnValue(of(dog));
      await store.load();

      const result = await store.add('  Walk dog  ');

      expect(result).toBe(true);
      expect(api.create).toHaveBeenCalledWith({ title: 'Walk dog' });
      expect(store.todos()).toEqual([dog, milk]);
      expect(store.adding()).toBe(false);
    });

    it('keeps the list sorted by date added', async () => {
      const backdated: Todo = { id: '3', title: 'Backdated', createdAt: '2025-12-31T00:00:00Z' };
      api.getAll.mockReturnValue(of([milk, dog]));
      api.create.mockReturnValue(of(backdated));
      await store.load();

      await store.add('Backdated');

      expect(store.todos()).toEqual([dog, milk, backdated]);
    });

    it('ignores blank titles without calling the api', async () => {
      const result = await store.add('   ');

      expect(result).toBe(false);
      expect(api.create).not.toHaveBeenCalled();
    });

    it('returns false and sets an error when the request fails', async () => {
      api.create.mockReturnValue(throwError(() => new Error('network')));

      const result = await store.add('Walk dog');

      expect(result).toBe(false);
      expect(store.todos()).toEqual([]);
      expect(store.error()).toContain('Could not add');
      expect(store.adding()).toBe(false);
    });
  });

  describe('remove', () => {
    beforeEach(async () => {
      api.getAll.mockReturnValue(of([milk, dog]));
      await store.load();
    });

    it('removes the todo after the api confirms', async () => {
      api.delete.mockReturnValue(of(undefined));

      await store.remove(milk.id);

      expect(api.delete).toHaveBeenCalledWith(milk.id);
      expect(store.todos()).toEqual([dog]);
      expect(store.deletingIds().size).toBe(0);
    });

    it('tracks the id as deleting while in flight and ignores duplicate requests', async () => {
      const response = new Subject<void>();
      api.delete.mockReturnValue(response);

      const pending = store.remove(milk.id);
      expect(store.deletingIds().has(milk.id)).toBe(true);

      await store.remove(milk.id);
      expect(api.delete).toHaveBeenCalledTimes(1);

      response.complete();
      await pending;
      expect(store.deletingIds().has(milk.id)).toBe(false);
    });

    it('keeps the todo and sets an error when the request fails', async () => {
      api.delete.mockReturnValue(throwError(() => new Error('network')));

      await store.remove(milk.id);

      expect(store.todos()).toEqual([dog, milk]);
      expect(store.error()).toContain('Could not delete');
      expect(store.deletingIds().size).toBe(0);
    });
  });

  it('clears the error', async () => {
    api.getAll.mockReturnValue(throwError(() => new Error('network')));
    await store.load();

    store.clearError();

    expect(store.error()).toBeNull();
  });
});
