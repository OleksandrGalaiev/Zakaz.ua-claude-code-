import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class PromotionsPage extends BasePage{
    readonly promotionsBlock: Locator;

    constructor(page: Page) {
        super(page)
        this.promotionsBlock = page.locator('[data-marker="categories slider"]')
    }
}
