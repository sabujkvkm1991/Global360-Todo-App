import { Component, inject, input, output } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { TODO_TITLE_MAX_LENGTH } from '../../data-access/todo.model';

function notBlank(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim().length === 0 ? { blank: true } : null;
}

/** Presentational form that emits a new TODO title. The parent decides when to reset it. */
@Component({
  selector: 'app-todo-form',
  imports: [ReactiveFormsModule],
  templateUrl: './todo-form.html',
  styleUrl: './todo-form.scss',
})
export class TodoForm {
  readonly busy = input(false);
  readonly submitted = output<string>();

  protected readonly maxLength = TODO_TITLE_MAX_LENGTH;
  protected readonly form = inject(NonNullableFormBuilder).group({
    title: ['', [Validators.required, Validators.maxLength(TODO_TITLE_MAX_LENGTH), notBlank]],
  });
  protected readonly title = this.form.controls.title;

  protected submit(): void {
    if (this.busy()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.emit(this.title.value.trim());
  }

  reset(): void {
    this.form.reset();
  }
}
