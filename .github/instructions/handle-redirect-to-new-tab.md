# How to handle a redirect that opens a new browser tab

This instruction describes the standard workflow for writing a Playwright test in this project when the action under test causes navigation to a different page that opens in a **new browser tab**.

The reference example is the `openDeliveryShop` flow used by the `@mainPage` test in [tests/mainPage.spec.ts](../../tests/mainPage.spec.ts), implemented in [pom/MainPage.ts](../../pom/MainPage.ts):

```ts
// pom/MainPage.ts
async openDeliveryShop(shopName: string) {
    await this.retailsInfoBlock.scrollIntoViewIfNeeded()
    let shop = this.page.locator(`[data-marker="${shopName}"]`)
    await shop.scrollIntoViewIfNeeded()
    const [newPage] = await Promise.all([
        this.page.context().waitForEvent('page'),
        shop.click()
    ])
    await newPage.waitForLoadState('load')
    return newPage
}
```

```ts
// tests/mainPage.spec.ts
let externalShop: ExternalPage
await test.step(`Open main page and click ${shopName} btn`, async () => {
    await app.goto(ZAKAZ)
    let externalPage = await app.mainPage.openDeliveryShop(shopName)
    externalShop = new ExternalPage(externalPage)
})
```

The goal is to capture the newly-opened tab and continue the test against it through a dedicated Page Object — never against the original `app.page`.

---

## Step 1. Put `Promise.all` inside the Page Object, not in the test

Per [.github/CLAUDE.md](../CLAUDE.md) — "Tests never touch `page` directly" and "When an action opens a new tab, return the new `Page` from the method".

Inside the source Page Object method that triggers the redirect, declare the click and the page-event waiter as a single `Promise.all` so the listener is registered **before** the click fires:

```ts
const [newPage] = await Promise.all([
    this.page.context().waitForEvent('page'), // 1) start listening for the new tab
    shop.click()                              // 2) click the button that opens it
])
```

Rules:

- The `waitForEvent('page')` call **must come first** in the array. Registering the listener after the click introduces a race condition where the new tab can appear before Playwright is listening.
- The clicked element (`shop` in the example) is the locator of the button/link that performs the redirect — already declared as a `readonly Locator` field in the Page Object constructor or built from a method argument (e.g. `[data-marker="${shopName}"]`).
- After the destructuring, wait for the new page to finish loading: `await newPage.waitForLoadState('load')`. Don't return a half-loaded `Page` to the test.
- `return newPage` from the method. The Page Object's responsibility ends with handing the new `Page` back — it does not assert against it and does not construct another Page Object internally.

Do **not** put `Promise.all` / `waitForEvent` inside the test body. If a redirect-to-new-tab is required and there is no Page Object method for it yet, add the method to the relevant Page Object first, then write the test.

## Step 2. In the test, build a destination Page Object from the returned `Page`

Once the source-page method returns the new `Page`, the test wraps it in the Page Object that represents the destination:

```ts
let externalPage = await app.mainPage.openDeliveryShop(shopName)
let externalShop = new ExternalPage(externalPage)
```

Rules:

- The variable holding the destination POM is declared **above** the first `test.step` if it must be visible across steps (`let externalShop: ExternalPage`), and assigned **inside** the step that performs the redirect. This matches the pattern in [tests/mainPage.spec.ts:31-36](../../tests/mainPage.spec.ts#L31-L36).
- All subsequent assertions and actions on the new tab go through the destination POM (`externalShop.getShopTitleName()`), never through `externalPage.locator(...)` directly. Raw locator usage in specs violates the POM rules in [CLAUDE.md](../CLAUDE.md).
- If a Page Object for the destination page does not exist yet, create one under [pom/](../../pom/) following the conventions in `CLAUDE.md` (constructor takes `page: Page`, all locators initialized as `readonly` fields, register in [pom/BaseTest.ts](../../pom/BaseTest.ts) only if it is reusable across many tests — one-off destination POMs can be instantiated locally).
- Do **not** reuse the source-page POM (`app.mainPage`, `app.header`, …) to query the new tab. Those POMs are bound to `app.page`, not to the new tab.

## Step 3. Distinguish new-tab redirects from in-place redirects

This instruction applies **only** when the redirect opens a new browser tab. A click that navigates within the same tab uses a different pattern:

- **New tab** (this instruction): use `Promise.all` + `context().waitForEvent('page')`, return the new `Page`, build a destination POM from it.
- **Same tab**: no `waitForEvent('page')`. Click, then `await app.page.waitForLoadState('load')` (or wait for a destination-specific locator). Build the destination POM against the same `app.page`: `const promotionsPage = new PromotionsPage(app.page)`.

Before writing the test, verify in the browser whether the click opens a new tab. If the destination opens in the same tab, do not force the `Promise.all` pattern — it will hang on `waitForEvent('page')`.

## Step 4. Use the existing locator and selector conventions

When implementing the Page Object method that performs the redirect:

- Locator for the trigger element follows the project rules in [CLAUDE.md](../CLAUDE.md) — prefer CSS by `data-marker`, then CSS by id/class, then XPath. Example: `this.page.locator(`[data-marker="${shopName}"]`)`.
- If the trigger sits inside a scrollable block, call `scrollIntoViewIfNeeded()` on the surrounding container and on the element itself before the click (see `openDeliveryShop`).
- Do not invent ad-hoc selectors inside the test. If a new selector is needed, declare it as a `readonly Locator` field on the Page Object.

---

## Checklist before finishing

- [ ] The `Promise.all([context().waitForEvent('page'), <element>.click()])` block lives in a Page Object method, not in the test.
- [ ] `waitForEvent('page')` is the **first** entry in the `Promise.all` array.
- [ ] The Page Object method awaits `newPage.waitForLoadState('load')` and returns `newPage`.
- [ ] The test assigns the returned `Page` to a local variable inside a `test.step`, then constructs the destination Page Object: `new <Destination>Page(newPage)`.
- [ ] All assertions on the new tab go through the destination POM, not raw `Page.locator(...)`.
- [ ] The clicked element actually opens a new tab in the live site — confirmed in a real browser.
- [ ] No source-page POM (`app.mainPage`, `app.header`, …) is used to query the new tab.
