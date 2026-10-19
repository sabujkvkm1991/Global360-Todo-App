import { InjectionToken } from '@angular/core';

/**
 * Base URL of the backend Web API.
 *
 * Defaults to a relative `/api` path, which the dev server proxies to the
 * .NET backend (see `proxy.conf.json`). Override it in `app.config.ts` when
 * the API is hosted on a different origin.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api',
});
