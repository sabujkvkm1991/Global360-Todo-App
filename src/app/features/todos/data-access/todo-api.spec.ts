import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../../core/api-config';
import { TodoApi } from './todo-api';
import { Todo } from './todo.model';

describe('TodoApi', () => {
  let api: TodoApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://test/api' },
      ],
    });
    api = TestBed.inject(TodoApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('fetches all todos', async () => {
    const todos: Todo[] = [{ id: '1', title: 'Buy milk', createdAt: '2026-01-01T09:00:00Z' }];

    const result = firstValueFrom(api.getAll());
    const req = http.expectOne('http://test/api/todos');
    expect(req.request.method).toBe('GET');
    req.flush(todos);

    expect(await result).toEqual(todos);
  });

  it('creates a todo', async () => {
    const created: Todo = { id: '2', title: 'Walk dog', createdAt: '2026-01-02T09:00:00Z' };

    const result = firstValueFrom(api.create({ title: 'Walk dog' }));
    const req = http.expectOne('http://test/api/todos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'Walk dog' });
    req.flush(created);

    expect(await result).toEqual(created);
  });

  it('deletes a todo by id, encoding it in the url', async () => {
    let completed = false;
    api.delete('a/b').subscribe({ complete: () => (completed = true) });
    const req = http.expectOne('http://test/api/todos/a%2Fb');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });
});
