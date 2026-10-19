import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TodoApi } from './todo-api';
import { Todo } from './todo.model';

function newestFirst(a: Todo, b: Todo): number {
  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}

/**
 * Signal-based state for the TODO feature.
 *
 * Components read state through the read-only signals and change it only
 * through the async methods, which keep the local list in sync with the API.
 */
@Injectable({ providedIn: 'root' })
export class TodoStore {
  private readonly api = inject(TodoApi);

  private readonly _todos = signal<readonly Todo[]>([]);
  private readonly _loading = signal(false);
  private readonly _adding = signal(false);
  private readonly _deletingIds = signal<ReadonlySet<string>>(new Set());
  private readonly _error = signal<string | null>(null);

  /** Most recently added first, so new items appear at the top, next to the add form. */
  readonly todos = computed(() => [...this._todos()].sort(newestFirst));
  readonly loading = this._loading.asReadonly();
  readonly adding = this._adding.asReadonly();
  readonly deletingIds = this._deletingIds.asReadonly();
  readonly error = this._error.asReadonly();
  readonly count = computed(() => this._todos().length);

  async load(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      this._todos.set(await firstValueFrom(this.api.getAll()));
    } catch {
      this._error.set('Could not load your TODO list. Please try again.');
    } finally {
      this._loading.set(false);
    }
  }

  /** Resolves to `true` when the item was saved, so callers can reset their input. */
  async add(title: string): Promise<boolean> {
    const trimmed = title.trim();
    if (!trimmed) {
      return false;
    }

    this._adding.set(true);
    this._error.set(null);
    try {
      const created = await firstValueFrom(this.api.create({ title: trimmed }));
      this._todos.update((todos) => [...todos, created]);
      return true;
    } catch {
      this._error.set('Could not add the item. Please try again.');
      return false;
    } finally {
      this._adding.set(false);
    }
  }

  async remove(id: string): Promise<void> {
    if (this._deletingIds().has(id)) {
      return;
    }

    this.setDeleting(id, true);
    this._error.set(null);
    try {
      await firstValueFrom(this.api.delete(id), { defaultValue: undefined });
      this._todos.update((todos) => todos.filter((todo) => todo.id !== id));
    } catch {
      this._error.set('Could not delete the item. Please try again.');
    } finally {
      this.setDeleting(id, false);
    }
  }

  clearError(): void {
    this._error.set(null);
  }

  private setDeleting(id: string, deleting: boolean): void {
    this._deletingIds.update((ids) => {
      const next = new Set(ids);
      if (deleting) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }
}
