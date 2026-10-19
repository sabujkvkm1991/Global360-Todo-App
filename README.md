# TODO App – Angular frontend

A small TODO list where you can view your items, add new ones and delete them. It is built with
**Angular 22** and talks to a separate **.NET Web API** backend that keeps the data in memory.

## Prerequisites

- **Node.js `^22.22.3`, `^24.15.0` or `>=26`**. Angular 22 refuses to run on older versions,
  including Node 22.21 and below. Check with `node -v`.
- npm 11 (ships with current Node releases).
- The backend API running locally (see [Connecting to the backend](#connecting-to-the-backend)).

## Getting started

```bash
npm install
npm start            # backend on HTTP  (dotnet run --launch-profile http)
npm run start:https  # backend on HTTPS (dotnet run --launch-profile https)
```

Either way the app is served on http://localhost:4200.

## Connecting to the backend

In development, the Angular dev server proxies every request under `/api` to the backend, so
the browser makes no cross-origin calls and the backend needs no CORS setup.

Pick the script that matches the launch profile the API was started with:

| Script                | Proxy config                                     | Backend target           |
| --------------------- | ------------------------------------------------ | ------------------------ |
| `npm start`           | [`proxy.conf.json`](proxy.conf.json)             | `http://localhost:5215`  |
| `npm run start:https` | [`proxy.conf.https.json`](proxy.conf.https.json) | `https://localhost:7051` |

The ports match the `http` and `https` profiles in the API's `launchSettings.json`. If they
change, update `target` in the matching proxy file and restart the dev server.

The HTTPS proxy has `"secure": false`, so it accepts the self-signed ASP.NET Core development
certificate. You do not need to run `dotnet dev-certs https --trust` for the proxy. Keep this
setting for local development only.

To call an API on a different origin without the proxy (for example in a deployed build),
provide the `API_BASE_URL` token in [`src/app/app.config.ts`](src/app/app.config.ts):

```ts
{ provide: API_BASE_URL, useValue: 'https://my-api.example.com/api' }
```

### Expected API contract

| Method   | URL               | Body               | Response                                 |
| -------- | ----------------- | ------------------ | ---------------------------------------- |
| `GET`    | `/api/todos`      | –                  | `200` `[{ "id", "title", "createdAt" }]` |
| `POST`   | `/api/todos`      | `{ "title": "…" }` | `201` `{ "id", "title", "createdAt" }`   |
| `DELETE` | `/api/todos/{id}` | –                  | `204`                                    |

`id` is treated as an opaque string (for example a GUID). `createdAt` is an ISO 8601 timestamp set by the server; the list is sorted by it, most recent first. Titles are trimmed, must not be blank,
and are limited to 200 characters (`TODO_TITLE_MAX_LENGTH` in
[`todo.model.ts`](src/app/features/todos/data-access/todo.model.ts)).

## Scripts

| Command           | What it does                                    |
| ----------------- | ----------------------------------------------- |
| `npm start`       | Dev server with live reload and the API proxy   |
| `npm run build`   | Production build into `dist/todo-app`           |
| `npm test`        | Unit tests (Vitest) in watch mode               |
| `npm run test:ci` | Unit tests once, for CI                         |
| `npm run lint`    | ESLint (angular-eslint)                         |
| `npm run format`  | Format with Prettier (`format:check` to verify) |

## Architecture

```
src/app
├── core/
│   └── api-config.ts            API_BASE_URL injection token
├── features/todos/
│   ├── data-access/
│   │   ├── todo.model.ts        Types shared with the API
│   │   ├── todo-api.ts          Stateless HttpClient wrapper
│   │   └── todo-store.ts        Signal-based state + async actions
│   ├── ui/
│   │   ├── todo-form/           Presentational: add item form
│   │   └── todo-list/           Presentational: list + delete buttons
│   └── todo-page/               Container wiring the store to the UI
├── app.routes.ts                Lazy-loaded TODO page route
└── app.config.ts                Router + HttpClient providers
```

- **Container and presentational components.** `TodoPage` is the only component that knows
  about the store. `TodoForm` and `TodoList` communicate only through `input()` and `output()`,
  so they are easy to reuse and test.
- **State in signals.** `TodoStore` exposes read-only signals (`todos`, `loading`, `adding`,
  `deletingIds`, `error`). Components change state only through its methods. Updates wait for the
  server to confirm, so the UI never shows data the backend has rejected.
- **Modern Angular defaults.** Standalone components, zoneless change detection, built-in
  control flow (`@if`/`@for`), signal inputs and outputs, `inject()`, and a lazy-loaded route.
- **UX and accessibility.** Labelled input, validation messages announced with `role="alert"`,
  per-item delete buttons named after their item, loading, empty and error states with retry,
  and light and dark themes.

## Testing

Tests use Vitest via the Angular CLI (`@angular/build:unit-test`) and are written in three
layers:

- **API service.** Uses `HttpTestingController` to check the URLs, methods and bodies it sends.
- **Store.** Runs against a mocked `TodoApi` and covers success, failure, loading flags and
  duplicate-delete protection.
- **Components.** The presentational components are tested through the DOM. `TodoPage` has
  integration tests that use the real store and API service, with HTTP mocked at the edge.
