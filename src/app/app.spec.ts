import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';

describe('App routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('shows the TODO page at the root url', async () => {
    const harness = await RouterTestingHarness.create('/');
    TestBed.inject(HttpTestingController).expectOne('/api/todos').flush([]);

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('My TODO list');
  });

  it('redirects unknown urls to the TODO page', async () => {
    const harness = await RouterTestingHarness.create('/does-not-exist');
    TestBed.inject(HttpTestingController).expectOne('/api/todos').flush([]);

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('My TODO list');
  });
});
