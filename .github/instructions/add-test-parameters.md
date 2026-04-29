# How to add test parameters to a parametrized test

This instruction describes the standard workflow for extending a data-driven Playwright test in this project with new parameters (e.g. adding more shops to the list iterated by [tests/mainPage.spec.ts](../../tests/mainPage.spec.ts)).

The reference example is the `@debug`-tagged test inside [tests/mainPage.spec.ts](../../tests/mainPage.spec.ts):

```ts
const shop: HomeDelivery[] = [
    {'shopName':"WINETIME",'shopLogoName':'WINETIME'},
]
for(const {shopName, shopLogoName} of shop){
    test(`Check correct redirect from zakaz main page to ${shopName} external shop main page`,
        {tag:'@debug'}, async({app, ZAKAZ})=>{
        ...
    })
}
```

The goal is to add new entries to the `shop` array so the same test runs for every parameter set.

---

## Step 1. Use the base link from the test

The base URL is provided by the `ZAKAZ` fixture defined in [test-options.ts](../../test-options.ts) and configured in [playwright.config.ts](../../playwright.config.ts):

```ts
ZAKAZ: 'https://zakaz.ua/uk/'
```

Use this exact URL when:
- opening the page in a browser to inspect the DOM,
- reasoning about which shop tiles are rendered on the main page.

Do **not** hardcode another URL — every new parameter must be discovered against the same `ZAKAZ` base link the test will actually use at runtime.

## Step 2. Check existing functions in the test

Before adding parameters, review the page-object methods the test already calls so the new parameter values are compatible with them:

- [pom/MainPage.ts](../../pom/MainPage.ts) — `openDeliveryShop(shopName: string)` clicks a tile located by `[data-marker="${shopName}"]`. The new `shopName` value MUST match the `data-marker` attribute on the main page.
- [pom/externalShop.ts](../../pom/externalShop.ts) — `getShopTitleName()` reads the `title` attribute of `//div[@data-marker="Logo"]//img` on the external shop. The new `shopLogoName` value MUST be a substring of that `title` attribute (the assertion uses `toContain`).

If a candidate parameter would require a different click flow or a different assertion target, do not extend the array — create a new test instead.

## Step 3. Use locators from the test

Reuse the locators already declared by the page objects:

- Main page tile: `[data-marker="${shopName}"]` (from `MainPage.openDeliveryShop`)
- Main page block container: `//div[contains(@class, 'RetailsInfo')]` (used for `scrollIntoViewIfNeeded`)
- External shop logo: `//div[@data-marker="Logo"]//img` (from `ExternalPage.getShopTitleName`)

When verifying a new parameter manually in DevTools, query the DOM with these exact selectors. If they match, the parameter is safe to add. If they don't, fix the page object first — don't invent ad-hoc selectors inside the test.

## Step 4. Analyze the DOM structure of the website

Open the base link from Step 1 in a browser and inspect the live DOM:

1. Scroll to the "Home delivery" / `RetailsInfo` block.
2. For each shop tile you want to add, read its `data-marker` attribute — that is the `shopName` value.
3. Click the tile, switch to the new tab, and inspect `div[data-marker="Logo"] img` — the value of its `title` attribute is the source of truth for `shopLogoName` (use the substring you want to assert against).
4. Confirm the tile actually opens a new tab (the page object expects `waitForEvent('page')`). If a shop opens in the same tab, it is **not** compatible with this test.

Record only what the DOM proves. Never guess `data-marker` values from the visible shop name — they may differ in casing, spacing, or transliteration.

## Step 5. Add new parameters based on the existing example

Append one object per shop to the `shop` array in [tests/mainPage.spec.ts](../../tests/mainPage.spec.ts), keeping the shape defined by `HomeDelivery` in [types/mainPageTypes.ts](../../types/mainPageTypes.ts):

```ts
const shop: HomeDelivery[] = [
    {'shopName':"WINETIME", 'shopLogoName':"WINETIME"},
    {'shopName':"<data-marker from Step 4>", 'shopLogoName':"<title substring from Step 4>"},
    // ...
]
```

Rules:
- Do not change the loop body, the test title template, or the `@debug` tag — adding parameters must not alter behavior for existing entries.
- Do not introduce new fields on `HomeDelivery` just to support one shop; if a shop needs extra data, that is a separate change to the type and to all existing entries.
- Run only the parametrized test after the change, e.g. `npx playwright test tests/mainPage.spec.ts --grep @debug`, and confirm every iteration passes before committing.

---

## Checklist before finishing

- [ ] `shopName` matches a `data-marker` that exists on `https://zakaz.ua/uk/`.
- [ ] `shopLogoName` is contained in the `title` attribute of the external shop's logo `img`.
- [ ] Clicking the tile opens a new browser tab.
- [ ] No page-object methods or locators were modified.
- [ ] All iterations of the parametrized test pass locally.
