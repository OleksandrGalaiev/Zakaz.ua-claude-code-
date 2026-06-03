import { test, expect } from "../test-options"

test.describe('Main page recipes tests', { tag: '@incognito' }, async () => {

    test('Order ingredients from the first recipe moves page to the stores block',
        { tag: '@recipes' }, async ({ app, ZAKAZ }) => {
        let recipeTitle: string | null = null

        await test.step('Open zakaz main page', async () => {
            await app.mainPage.goto(ZAKAZ)
        })
        await test.step('Click Рецепти button in header', async () => {
            await app.header.openRecipesPage()
        })
        await test.step('Check recipes block with recipe cards is displayed', async () => {
            await expect(app.recipesPage.recipesTable).toBeVisible()
            expect(await app.recipesPage.recipeCards.count()).toBeGreaterThan(0)
            recipeTitle = await app.recipesPage.getFirstRecipeTitle()
        })
        await test.step('Choose first recipe', async () => {
            await app.recipesPage.openFirstRecipe()
        })
        await test.step('Check recipe title matches the chosen recipe', async () => {
            await expect(app.recipesPage.recipeTitle).toBeVisible()
            await expect(app.recipesPage.recipeTitle).toHaveText(recipeTitle!)
        })
        await test.step('Click "Замовити інгредієнти" button', async () => {
            await app.recipesPage.orderIngredients()
        })
        await test.step('Check page moved to the stores block', async () => {
            await expect(app.recipesPage.availableRetails).toBeInViewport()
        })
    })
})
