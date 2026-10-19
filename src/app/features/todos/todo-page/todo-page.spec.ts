import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TodoPage } from './todo-page';

/** Integration test: real store and API service, with HTTP mocked at the boundary. */
describe('TodoPage', () => {
  let fixture: ComponentFixture<TodoPage>;
  let element: HTMLElement;
  let http: HttpTestingController;

  const titles = () =>
    Array.from(element.querySelectorAll('li span')).map((el) => el.textContent!.trim());
  const input = () => element.querySelector<HTMLInputElement>('input')!;
  const banner = () => element.querySelector('.todo-page__banner');

  /** Lets the store's async continuations run, then waits for rendering. */
  async function render(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }

  async function addItem(title: string): Promise<void> {
    input().value = title;
    input().dispatchEvent(new Event('input'));
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await render();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TodoPage);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('loads and shows the TODO list, most recent first', async () => {
    expect(element.textContent).toContain('Loading');

    http.expectOne('/api/todos').flush([
      { id: '1', title: 'Buy milk', createdAt: '2026-01-01T09:00:00Z' },
      { id: '2', title: 'Walk dog', createdAt: '2026-01-02T09:00:00Z' },
    ]);
    await render();

    expect(titles()).toEqual(['Walk dog', 'Buy milk']);
    expect(element.textContent).toContain('2 items');
  });

  it('adds an item and clears the input', async () => {
    http.expectOne('/api/todos').flush([]);
    await render();

    await addItem('Buy milk');
    const req = http.expectOne({ method: 'POST', url: '/api/todos' });
    expect(req.request.body).toEqual({ title: 'Buy milk' });
    req.flush({ id: '1', title: 'Buy milk', createdAt: '2026-01-01T09:00:00Z' });
    await render();

    expect(titles()).toEqual(['Buy milk']);
    expect(input().value).toBe('');
  });

  it('keeps the input and shows an error when adding fails', async () => {
    http.expectOne('/api/todos').flush([]);
    await render();

    await addItem('Buy milk');
    http
      .expectOne({ method: 'POST', url: '/api/todos' })
      .flush(null, { status: 500, statusText: 'Server Error' });
    await render();

    expect(titles()).toEqual([]);
    expect(input().value).toBe('Buy milk');
    expect(banner()?.textContent).toContain('Could not add');
  });

  it('deletes an item', async () => {
    http.expectOne('/api/todos').flush([
      { id: '1', title: 'Buy milk', createdAt: '2026-01-01T09:00:00Z' },
      { id: '2', title: 'Walk dog', createdAt: '2026-01-02T09:00:00Z' },
    ]);
    await render();

    element.querySelector<HTMLButtonElement>('button[aria-label="Delete Buy milk"]')!.click();
    await render();
    http
      .expectOne({ method: 'DELETE', url: '/api/todos/1' })
      .flush(null, { status: 204, statusText: 'No Content' });
    await render();

    expect(titles()).toEqual(['Walk dog']);
    expect(element.textContent).toContain('1 item');
  });

  it('shows an error with a retry when loading fails', async () => {
    http.expectOne('/api/todos').flush(null, { status: 0, statusText: 'Unknown Error' });
    await render();

    expect(banner()?.textContent).toContain('Could not load');

    element.querySelector<HTMLButtonElement>('.todo-page__banner button')!.click();
    await render();
    http
      .expectOne('/api/todos')
      .flush([{ id: '1', title: 'Buy milk', createdAt: '2026-01-01T09:00:00Z' }]);
    await render();

    expect(banner()).toBeNull();
    expect(titles()).toEqual(['Buy milk']);
  });
});
