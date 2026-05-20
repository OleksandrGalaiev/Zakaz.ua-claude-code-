# CLAUDE.md

Guidance for Claude Code when working in this repository. Describes the architecture and the mandatory coding conventions. When generating or editing tests and Page Objects, follow these rules — do not deviate.

## Stack and structure

- **Playwright** (`@playwright/test`) + **TypeScript** (CommonJS).
- **dotenv** — secrets via `.env` (`USER_LOGIN`, `USER_PASSWORD`).
- Directory layout:
  - [pom/](pom/) — Page Objects. Top-level pages live in `pom/`, nested modules go into subfolders (e.g. [pom/header/](pom/header/)).
  - [pom/BaseTest.ts](pom/BaseTest.ts) — facade that aggregates every Page Object and shared actions (`goto`, `getCurrentUrl`).
  - [test-options.ts](test-options.ts) — extends `test` with the `app: BaseTest` fixture and the `ZAKAZ` option.
  - [tests/](tests/) — `*.spec.ts` specs and `*.setup.ts` setup files.
  - [types/](types/) — TypeScript interfaces / types for test data and parametrization.
  - [Helpers/](Helpers/) — reusable functions and wrappers around external libraries that are project-agnostic and can be lifted into other projects.
  - [auth/user.json](auth/) — storage state produced by the setup project (gitignored).
  - [playwright.config.ts](playwright.config.ts) — projects `setup`, `authorize` (with storage state), `incognito`.

## Page Object Model architecture

**Tests never touch `page` directly.** They receive `app: BaseTest` from the fixture and call Page Object methods through it.

### Page Object rules

1. Class name is `<Name>Page` or named after the entity (`MyAccount`, `ExternalPage`). The file is PascalCase and matches the class name.
2. The constructor takes `page: Page` and stores it in a `private` field.
3. **Every locator is initialized in the constructor** and stored in `private readonly Locator` fields. Do not build locators inside methods.
4. Actions (clicks, fills, waits) are separate `async` methods on the class. Assertions (`expect`) belong in the test, not in the Page Object — except where the method is meaningless without a wait (e.g. `waitFor`).
5. When an action opens a new tab, return the new `Page` from the method (see [pom/MainPage.ts:13-20](pom/MainPage.ts#L13-L20)). The test wraps it into the appropriate Page Object.
6. Register every new Page Object in [pom/BaseTest.ts](pom/BaseTest.ts): import + field + constructor initialization.

### Access modifiers — `private` by default

Tests interact with Page Objects through a small, intentional public surface. Everything that is an internal implementation detail must be `private`.

Mandatory:

- **`page` field — always `private`.** Tests must never reach into `app.<pageObject>.page` to call raw Playwright APIs. If a test needs `page`-level behavior, expose a dedicated method on the Page Object instead.
- **Locator fields — always `private readonly`.** Locators are implementation details; tests never read them directly. Combine the modifiers in the declared order: `private readonly <name>: Locator`.
- **Internal helper methods — `private`.** Methods that exist only to compose larger actions inside the Page Object (e.g. opening a dropdown before clicking an item, building a dynamic locator, normalizing data before returning it) are `private async` and not called from specs.
- **Public methods — only what tests actually use.** A method becomes `public` (the TypeScript default — no keyword needed) only when at least one spec calls it. Do not pre-publish methods "just in case".

Examples:

```ts
export class MyAccount {
    private readonly page: Page;
    private readonly accountDropdownTrigger: Locator;
    private readonly myAddressesLink: Locator;
    private readonly addressCard: Locator;
    private readonly addressCardHeader: Locator;

    constructor(page: Page) {
        this.page = page;
        this.accountDropdownTrigger = page.locator("//span[contains(@class, 'AccountButtonContent')]").nth(1);
        this.myAddressesLink = page.getByRole('link', { name: 'Мої адреси' });
        this.addressCard = page.locator('[data-marker="Address"]');
        this.addressCardHeader = this.addressCard.locator('[data-marker="Address title"]');
    }

    // public — called from specs
    async openMyAccountHeaderMenuPoint(menuPoint: string) {
        await this.accountDropdownTrigger.click();
        await this.page.locator("//div[contains(@class, 'AccountNavigation__listItem')]", { hasText: menuPoint }).click();
    }

    // private — internal helper, used only inside this class
    private async waitForAddressesLoaded() {
        await this.addressCard.first().waitFor({ state: 'visible' });
    }
}
```

When refactoring an existing Page Object, audit every field and method: if no spec references it, mark it `private`.

### Importing `Page` / `Locator`

The existing code mixes `from "@playwright/test"` and `from "playwright"`. **For new code use `@playwright/test`** — it removes the type-source confusion and matches the fixtures.

```ts
import { Locator, Page } from '@playwright/test';
```

## Locators — prefer CSS / XPath

When writing new locators **prefer CSS and XPath selectors** over `getByRole` / `getByTestId` / `getByText`.

Selection order:

1. **CSS by `data-marker`** (the project's stable attribute) — `[data-marker="Submit"]`, `[data-marker*="Header"]`.
2. **CSS by id / class** — `#header`, `.HeaderLogin__login`.
3. **XPath** — when DOM navigation, `text()`, `contains()`, parents, or compound conditions are required:
   - `//button[@data-marker="sidebar-button"]`
   - `//span[text()='For partners']`
   - `//div[contains(@class, 'HomeRetails')]`
4. `getByRole` / `getByTestId` — allowed only when the element has no `data-marker` or stable class (e.g. `loginButton` in [pom/header/HeaderPage.ts:36](pom/header/HeaderPage.ts#L36)).

```ts
this.submitButton    = this.dialog.locator('button[data-marker="Submit"]');
this.catalogButton   = page.locator('//button[@data-marker="sidebar-button"]');
this.homeRetails     = page.locator("//div[contains(@class, 'HomeRetails')]");
```

For dynamic values use template strings inside CSS:
```ts
this.page.locator(`[data-marker="${shopName}"]`).click();
```

## Test style

### Spec skeleton

```ts
import { test, expect } from "../test-options";

test.describe('<Feature> functionality', () => {
    test('<scenario name>', { tag: '@<feature>' }, async ({ app, ZAKAZ }) => {
        await test.step('<what we do>', async () => {
            await app.goto(ZAKAZ);
            // actions via app.<pageObject>.<method>()
        });

        await test.step('<next step>', async () => {
            // assertions
        });
    });
});
```

Mandatory:

- Import `test` and `expect` **only** from [test-options.ts](test-options.ts) — otherwise the `app` fixture is unavailable.
- Destructure the fixtures: `async ({ app, ZAKAZ }) => { ... }`.
- Every test carries a tag: `{ tag: '@login' }`, `{ tag: '@mainPage' }`, etc. The tag matches the spec's main feature.
- Group with `test.describe('<Feature> functionality', () => { ... })`.
- Site entry point is always `app.goto(ZAKAZ)`, never `page.goto(...)` directly.

### `test.step` — required

**Every action and assertion inside a test is wrapped in `await test.step('...', async () => { ... })`.** This is a project requirement, not optional.

- Step name — short active-voice English: `'Open main page and click WINETIME btn'`, `'Check logo on external mainpage'`, `'open site with saved storage state'`.
- One step = one logical action or one block of assertions. Do not pile everything into a single step.
- Variables that need to cross step boundaries are declared above the first `step` (`let externalShop: ExternalPage`) and assigned inside a step.

### Parameterized tests

The project's pattern is: an array of objects typed by an interface from [types/](types/), then a `for...of` loop with destructuring, with `test(...)` declared inside the loop. See [tests/mainPage.spec.ts:8-23](tests/mainPage.spec.ts#L8-L23).

```ts
import { HomeDelivery } from "../types/mainPageTypes";

const shop: HomeDelivery[] = [
    { shopName: "WINETIME", shopLogoName: 'WINETIME' },
    // add new cases here
];

for (const { shopName, shopLogoName } of shop) {
    test(`Check correct redirect from zakaz main page to external main page`, { tag: '@mainPage' }, async ({ app, ZAKAZ }) => {
        await test.step(`Open main page and click ${shopName} btn`, async () => {
            // ...
        });
        await test.step('Check logo on external mainpage', async () => {
            expect(await externalShop.getShopTitleName()).toContain(shopLogoName);
        });
    });
}
```

Rules:

- **All types and interfaces used to parameterize tests live in [types/](types/), one file per feature: `<feature>Types.ts`.** Never declare data-shape interfaces inline in a spec — define them in `types/` and import.
- Destructure fields directly in `for (const { ... } of ...)`.
- Test name and/or `test.step` names interpolate the parameter (`${shopName}`) so cases are distinguishable in the report.
- **Do not switch to `test.describe.parallel` with an array inside `test.describe`** — stay on the current `for...of` + `test(...)` pattern.

### Assertions

- `expect(...)` — only in specs, never in Page Objects.
- To wait for an element state — `locator.waitFor({ state: 'visible' })` (see `BaseTest.goto`).
- For dialog visibility and similar checks — `await expect(locator).toBeVisible()` / `toBeHidden()`.

## Reusable code — `Helpers/`

**Any function or wrapper around an external library that is not tied to this project (no zakaz-specific selectors, URLs, or business logic) goes into [Helpers/](Helpers/).**

Examples of what belongs in `Helpers/`:

- Date/time formatters, string utilities, random data generators.
- Wrappers around third-party libs (`dotenv`, `zod`, faker, axios-style HTTP clients, file IO).
- Generic Playwright helpers that take a `Page` / `Locator` and could drop into another Playwright project unchanged.
- API client wrappers and auth-token utilities, when they are not project-specific.

Rules:

- One module per concern: `Helpers/<concern>.ts` (e.g. `Helpers/randomData.ts`, `Helpers/httpClient.ts`).
- Pure / dependency-injected: helpers receive what they need as arguments and do not import from `pom/` or `tests/`. If a function needs to know about `BaseTest`, a Page Object, or a project URL, it does **not** belong in `Helpers/` — it belongs in the relevant Page Object or in `BaseTest`.
- Each helper is exported by name (`export function ...` / `export class ...`); no default exports.
- Tests and Page Objects import from `Helpers/` rather than re-implementing the same utility locally.

## Fixtures and authentication

### `app` and `ZAKAZ`

[test-options.ts](test-options.ts) extends the base `test`:

- `app: BaseTest` — single entry point to every Page Object.
- `ZAKAZ: string` — base URL, supplied in [playwright.config.ts:19](playwright.config.ts#L19) (`use.ZAKAZ`).

Never `new BaseTest(page)` manually in a spec — always take it from the fixture.

### Setup project and storage state

- [tests/auth.setup.ts](tests/auth.setup.ts) — performs login and stores storage state in `auth/user.json` (`STORAGE_STATE` is exported from `playwright.config.ts`).
- The `authorize` project uses that storage state and depends on `setup`.
- The `incognito` project has no saved session — for negative / guest scenarios.
- When adding a new login or role, extend the setup file and/or config — do not duplicate login logic in individual tests.

## TypeScript

- `private readonly` on every locator field of a Page Object; the `page` field is also `private`.
- Internal helper methods on a Page Object are `private async`. Public methods stay unmarked (TypeScript default).
- Explicit typing for public methods and return values when it isn't trivially inferred.
- Test data interfaces live in [types/](types/), one file per feature: `<feature>Types.ts`.
- Do not import `Page` from both `playwright/test` and `@playwright/test` in the same project — stick to `@playwright/test`.

## Running tests

```bash
npx playwright test                              # all projects
npx playwright test --project=authorize          # authorized only
npx playwright test --project=incognito          # no session
npx playwright test --grep @login                # by tag
npx playwright show-report                       # html report
```

## Reusable instructions

Task-specific, prompt-callable workflows live in [instructions/](instructions/). When a prompt matches one of these tasks, read the file end-to-end and execute every step (including its final checklist) before answering.

- [add-test-parameters.md](instructions/add-test-parameters.md) — adding new parameter sets to a parametrized Playwright test (reference: the `@debug` test in [../tests/mainPage.spec.ts](../tests/mainPage.spec.ts)).
- [handle-redirect-to-new-tab.md](instructions/handle-redirect-to-new-tab.md) — writing a test whose action opens a new browser tab: `Promise.all` with `context().waitForEvent('page')` inside the source Page Object method, then build a destination POM from the returned `Page` (reference: `openDeliveryShop` in [../pom/MainPage.ts](../pom/MainPage.ts) and the `@mainPage` test in [../tests/mainPage.spec.ts](../tests/mainPage.spec.ts)).

## Checklist when adding a test

1. New page elements needed → add locators to an existing Page Object or create a new one in `pom/` (and register it in `BaseTest`).
2. Locators — CSS by `data-marker` / XPath, stored as `private readonly` fields, initialized in the constructor. The `page` field is also `private`.
3. Methods used only inside the Page Object are `private async`; only spec-facing methods stay public.
4. Test data with multiple cases → declare an `interface` in [types/](types/) and use `for...of` with destructuring. Never inline the type in the spec.
5. Reusable utility / external-library wrapper → put it in [Helpers/](Helpers/), not next to the test.
6. Every step of the scenario is wrapped in `await test.step('...', async () => { ... })`.
7. `test` / `expect` are imported from [test-options.ts](test-options.ts).
8. Test is tagged `{ tag: '@<feature>' }` and sits inside `test.describe('<Feature> functionality', ...)`.
9. No direct `page.goto` or raw locators in the spec — everything goes through `app.<pageObject>`.
