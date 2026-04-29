import { Locator, Page } from '@playwright/test';

export class PromotionsPage {
    readonly page: Page;
    readonly promotionsBlock: Locator;

    constructor(page: Page) {
        this.page = page;
        this.promotionsBlock = page.locator('[data-marker="categories slider"]')
    }
}
