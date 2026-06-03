# CLAUDE.md

Guidance for Claude Code when working in this repository. Describes the architecture and the mandatory coding conventions. When generating or editing tests and Page Objects, follow these rules — do not deviate.

## Stack and structure

- **Playwright** (`@playwright/test`) + **TypeScript** (CommonJS).
- **dotenv** — secrets via `.env` (`USER_LOGIN`, `USER_PASSWORD`).
- Directory layout:
  - [pom/](pom/) — Page Objects. Top-level pages live in `pom/`, nested modules go into subfolders (e.g. [pom/header/](pom/header/)).
  - [pom/BasePage.ts](pom/BasePage.ts) — **base class every Page Object `extends`**. Holds the shared `protected page` field and the shared actions `goto(url)` / `getCurrentUrl()`.
  - [pom/Pages.ts](pom/Pages.ts) — **facade that aggregates every Page Object** as a public field (`mainPage`, `header`, `loginPage`, `myAccount`, `externalShop`, `promotionalPage`). This is the object behind the `app` fixture. It does **not** extend `BasePage` and has **no** `goto` of its own.
  - [test-options.ts](test-options.ts) — extends `test` with the `app: Pages` fixture and the `ZAKAZ` option.
  - [tests/](tests/) — `*.spec.ts` specs and `*.setup.ts` setup files.
  - [types/](types/) — TypeScript interfaces / types for test data and parametrization.
  - [Helpers/](Helpers/) — reusable, project-agnostic functions and wrappers around external libraries that can be lifted into other projects. (Convention; the folder is created on first use.)
  - [auth/user.json](auth/) — storage state produced by the setup project (gitignored).
  - [playwright.config.ts](playwright.config.ts) — projects `setup`, `authorize` (with storage state), `incognito`.

## Page Object Model architecture

**Tests never touch `page` directly.** They receive `app: Pages` from the fixture and call Page Object methods / public locators through it.

### `BasePage` — the shared base class

Every Page Object **extends [`BasePage`](pom/BasePage.ts)** and calls `super(page)` in its constructor:

```ts
export class MainPage extends BasePage {
    constructor(page: Page) {
        super(page);
        // ...locators
    }
}
```

`BasePage` provides:

- `protected page: Page` — the shared page handle. It is `protected` (not `private`) precisely so subclasses can use `this.page` inside their methods. Tests still never reach `app.<pageObject>.page` — the field is not public.
- `async goto(url)` — `this.page.goto(url)`.
- `async getCurrentUrl()` — `this.page.url()`.

**Per-page readiness via overriding `goto`.** A Page Object that has a reliable "page is ready" marker overrides `goto`, calls `super.goto(url)`, then waits for that marker — see [pom/MainPage.ts:27-30](pom/MainPage.ts#L27-L30) (`homeRetails`) and [pom/externalShop.ts:19-22](pom/externalShop.ts#L19-L22) (`chainHeader`). This is why the site entry point is `app.mainPage.goto(ZAKAZ)`, not a facade-level `goto`.

### Page Object rules

1. Class name is `<Name>Page` or named after the entity (`MyAccount`, `ExternalPage`). The file is PascalCase and matches the class name.
2. The class `extends BasePage` and the constructor takes `page: Page` and calls `super(page)`. Do not redeclare a local `page` field — it is inherited as `protected`.
3. **Every locator is initialized in the constructor** and stored in `readonly Locator` fields. Do not build locators inside methods (dynamic, argument-driven locators built inline in a method are the only exception — see `MyAccount.openMyAccountHeaderMenuPoint`).
4. Actions (clicks, fills, waits) are separate `async` methods on the class. Assertions (`expect`) belong in the test, not in the Page Object — except where the method is meaningless without a wait (e.g. `waitFor`).
5. When an action opens a new tab, return the new `Page` from the method (see [pom/MainPage.ts:15-25](pom/MainPage.ts#L15-L25)). The test wraps it into the appropriate Page Object.
6. Register every new Page Object in [pom/Pages.ts](pom/Pages.ts): import + field + constructor initialization.

### Access modifiers

Tests interact with Page Objects through their public surface: public methods **and** public locators (specs do call `expect(app.loginPage.dialog)`, `app.header.loginButton.click()`, `app.myAccount.settingsEmailField`, etc.). Anything that is purely an internal implementation detail stays `private`.

Rules:

- **`page` field — inherited as `protected` from `BasePage`.** Never redeclare it. Tests must never reach into `app.<pageObject>.page` to call raw Playwright APIs (it is `protected`, not public, so they can't) — if a test needs `page`-level behaviour, add a method to the Page Object.
- **Locator fields — always `readonly`.** A locator is `readonly Locator`, and:
  - **public `readonly`** when a spec uses it directly — for an assertion (`expect(app.loginPage.dialog).toBeVisible()`), a direct click (`app.header.loginButton.click()`), or a `textContent()` read. Most locators in [HeaderPage](pom/header/HeaderPage.ts), [LoginPage](pom/LoginPage.ts) and [PromotionsPage](pom/PromotionsPage.ts) are this kind.
  - **`private readonly`** when only the Page Object's own methods touch it (e.g. `myAddressesLink`, `addressCard`, `addressCardHeader` in [MyAccount](pom/header/MyAccount.ts)).
  - Declare modifiers in order: `private readonly <name>: Locator`.
- **Internal helper methods — `private async`.** Methods that only compose larger actions (open a dropdown before clicking, build a dynamic locator, normalize data) are `private` and not called from specs.
- **Public methods — only what tests actually use.** A method becomes public (the TypeScript default — no keyword) when at least one spec calls it. Don't pre-publish "just in case".

Example:

```ts
export class MyAccount extends BasePage {
    private readonly accountDropdownTrigger: Locator;   // used only inside this class
    private readonly addressCard: Locator;
    settingsEmailField: Locator;                         // public — a spec asserts on it

    constructor(page: Page) {
        super(page);                                     // page comes from BasePage (protected)
        this.accountDropdownTrigger = page.locator("//span[contains(@class, 'AccountButtonContent')]").nth(1);
        this.addressCard = page.locator('[data-marker="Address"]');
        this.settingsEmailField = page.locator('//p[@data-marker="email"]');
    }

    // public — called from specs
    async openMyAccountHeaderMenuPoint(menuPoint: string) {
        await this.accountDropdownTrigger.click();
        await this.page.locator("//div[contains(@class, 'AccountNavigation__listItem')]", { hasText: menuPoint }).click();
    }
}
```

When refactoring a Page Object, audit every field and method: if no spec references it, mark it `private`.

### Importing `Page` / `Locator`

The existing code mixes `from "@playwright/test"` and `from "playwright"` (e.g. `BasePage`, `MainPage`, `externalShop` still import from `"playwright"`). **For new and edited code use `@playwright/test`** — it removes the type-source confusion and matches the fixtures.

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

test.describe('<Feature> functionality', { tag: '@auth' }, () => {
    test('<scenario name>', { tag: '@<feature>' }, async ({ app, ZAKAZ }) => {
        await test.step('<what we do>', async () => {
            await app.mainPage.goto(ZAKAZ);
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
- Site entry point is always `app.mainPage.goto(ZAKAZ)` (or another Page Object's `goto`), never `app.goto(...)` (the `Pages` facade has no `goto`) and never `page.goto(...)` directly.

### Tagging — two levels: project selector + feature filter

Tags drive both **which project runs the test** and **ad-hoc filtering**. Projects in [playwright.config.ts](playwright.config.ts) `grep` by the *project-selector* tag; the *feature* tag narrows further via `--grep`.

- **Project-selector tag — on the `test.describe`**, inherited by every test inside:
  - `@auth` → runs in the `authorize` project (saved storage state). Use for any logged-in scenario.
  - `@incognito` → runs in the `incognito` project (no session). Use for guest / negative scenarios.
- **Feature tag — on the individual `test`**: `@login`, `@mainPage`, `@userCabinet`, `@debug`, … Matches the scenario's feature and is used for targeted runs.

A test therefore effectively carries both tags (describe + test). Example: `describe('Login|Logout', { tag: '@auth' })` → `test('Login_Logout', { tag: '@login' })`. Run it with `--project=authorize --grep @login`. A test whose `describe` has **no** project-selector tag matches **no** project and silently won't run.

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
- To wait for an element state — `locator.waitFor({ state: 'visible' })` (see the `goto` override in [MainPage](pom/MainPage.ts#L27-L30)).
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

- `app: Pages` — single entry point to every Page Object (the [`Pages`](pom/Pages.ts) facade).
- `ZAKAZ: string` — base URL, supplied in [playwright.config.ts:19](playwright.config.ts#L19) (`use.ZAKAZ`).

Never `new Pages(page)` manually in a spec — always take it from the fixture. (Constructing a single destination Page Object from a returned new-tab `Page`, e.g. `new ExternalPage(newPage)`, is fine — see the new-tab instruction.)

### Setup project and storage state

- [tests/auth.setup.ts](tests/auth.setup.ts) — performs login and stores storage state in `auth/user.json` (`STORAGE_STATE` is exported from `playwright.config.ts`).
- The `authorize` project uses that storage state and depends on `setup`.
- The `incognito` project has no saved session — for negative / guest scenarios.
- When adding a new login or role, extend the setup file and/or config — do not duplicate login logic in individual tests.

## TypeScript

- `readonly` on every locator field of a Page Object (`private readonly` when internal-only, public `readonly` when a spec uses it). The `page` field is inherited as `protected` from `BasePage` — never redeclared.
- Internal helper methods on a Page Object are `private async`. Public methods stay unmarked (TypeScript default).
- Explicit typing for public methods and return values when it isn't trivially inferred.
- Test data interfaces live in [types/](types/), one file per feature: `<feature>Types.ts`.
- Do not import `Page` from both `playwright/test` and `@playwright/test` in the same project — stick to `@playwright/test`.

## Running tests

```bash
npx playwright test                                   # all projects
npx playwright test --project=authorize               # all @auth tests (storage state)
npx playwright test --project=incognito               # all @incognito tests (no session)
npx playwright test --project=authorize --grep @login # @auth + feature filter (AND)
npx playwright test --grep "@auth|@login"             # OR across tags (regex alternation)
npx playwright test --grep "(?=.*@auth)(?=.*@login)"  # AND across tags without --project (lookahead)
npx playwright show-report                            # html report
```

`--grep` takes a **regex**, not a tag list. A project's `grep` and a CLI `--grep` combine with **AND**, so `--project=authorize --grep @login` is the clean way to run one feature inside the authorized suite. Passing `"@auth @login"` as a literal string matches nothing.

## Reusable instructions

Task-specific, prompt-callable workflows live in [instructions/](instructions/). When a prompt matches one of these tasks, read the file end-to-end and execute every step (including its final checklist) before answering.

- [add-test-parameters.md](instructions/add-test-parameters.md) — adding new parameter sets to a parametrized Playwright test (reference: the `@debug` test in [../tests/mainPage.spec.ts](../tests/mainPage.spec.ts)).
- [handle-redirect-to-new-tab.md](instructions/handle-redirect-to-new-tab.md) — writing a test whose action opens a new browser tab: `Promise.all` with `context().waitForEvent('page')` inside the source Page Object method, then build a destination POM from the returned `Page` (reference: `openDeliveryShop` in [../pom/MainPage.ts](../pom/MainPage.ts) and the `@mainPage` test in [../tests/mainPage.spec.ts](../tests/mainPage.spec.ts)).

> Note: the two instruction files predate the `BaseTest` → `BasePage`/`Pages` split and still mention `BaseTest` and `app.goto`. Treat this `CLAUDE.md` as the source of truth: register Page Objects in [pom/Pages.ts](pom/Pages.ts), and use `app.mainPage.goto(ZAKAZ)`.

## Checklist when adding a test

1. New page elements needed → add locators to an existing Page Object or create a new one in `pom/` that `extends BasePage` (and register it in [pom/Pages.ts](pom/Pages.ts)).
2. Locators — CSS by `data-marker` / XPath, stored as `readonly` fields initialized in the constructor (`private readonly` when internal-only, public `readonly` when a spec uses them). The `page` field is inherited `protected` from `BasePage` — don't redeclare it; call `super(page)`.
3. Methods used only inside the Page Object are `private async`; only spec-facing methods stay public.
4. Test data with multiple cases → declare an `interface` in [types/](types/) and use `for...of` with destructuring. Never inline the type in the spec.
5. Reusable utility / external-library wrapper → put it in [Helpers/](Helpers/), not next to the test.
6. Every step of the scenario is wrapped in `await test.step('...', async () => { ... })`.
7. `test` / `expect` are imported from [test-options.ts](test-options.ts).
8. Test sits inside `test.describe('<Feature> functionality', { tag: '@auth' | '@incognito' }, ...)` (project selector) and the test itself is tagged `{ tag: '@<feature>' }` (feature filter).
9. Site entry is `app.mainPage.goto(ZAKAZ)`. No `app.goto`, no direct `page.goto`, no raw locators in the spec — everything goes through `app.<pageObject>`.
