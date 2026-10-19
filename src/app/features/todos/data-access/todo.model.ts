export interface Todo {
  readonly id: string;
  readonly title: string;
  /** ISO 8601 timestamp set by the server when the item was added. */
  readonly createdAt: string;
}

export interface CreateTodoRequest {
  readonly title: string;
}

/** Keep in sync with the validation rules of the backend API. */
export const TODO_TITLE_MAX_LENGTH = 200;
