import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class RecipesPage extends BasePage{
    readonly recipesTable: Locator
    readonly recipeCards: Locator
    readonly recipeTitle: Locator
    readonly orderIngredientsButton: Locator
    readonly availableRetails: Locator

    constructor(page: Page){
        super(page)
        this.recipesTable = page.locator('[data-marker="Recipes Table"]')
        this.recipeCards = page.locator('[data-marker="recipe-card"]')
        this.recipeTitle = page.getByRole('heading', { level: 1 })
        this.orderIngredientsButton = page.locator('[data-marker="Order ingredients"]')
        this.availableRetails = page.locator('[data-marker="Available Retails"]')
    }

    async getFirstRecipeTitle(){
        const firstCard = this.recipeCards.first()
        await firstCard.waitFor({state:'visible'})
        return await firstCard.locator('img').getAttribute('alt')
    }

    async openFirstRecipe(){
        await this.recipeCards.first().click()
        await this.orderIngredientsButton.waitFor({state:'visible'})
    }

    async orderIngredients(){
        await this.orderIngredientsButton.scrollIntoViewIfNeeded()
        await this.orderIngredientsButton.click()
    }
}
