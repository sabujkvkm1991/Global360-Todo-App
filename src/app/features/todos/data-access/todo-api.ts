import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api-config';
import { CreateTodoRequest, Todo } from './todo.model';

/** Thin HTTP client for the backend `/todos` resource. Holds no state. */
@Injectable({ providedIn: 'root' })
export class TodoApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/todos`;

  getAll(): Observable<Todo[]> {
    return this.http.get<Todo[]>(this.baseUrl);
  }

  create(request: CreateTodoRequest): Observable<Todo> {
    return this.http.post<Todo>(this.baseUrl, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }
}
