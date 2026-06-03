import { Locator, Page } from "playwright";
import { BasePage } from "./BasePage";


export class MainPage extends BasePage{
    homeRetails: Locator
    retailsInfoBlock: Locator

    constructor(page: Page){
        super(page)
        this.homeRetails = page.locator('[data-marker^="MainRetails Card"]').first()
        this.retailsInfoBlock = page.locator("//div[contains(@class, 'RetailsInfo')]").first()
    }

    async openDeliveryShop(shopMarker:string){
        await this.retailsInfoBlock.scrollIntoViewIfNeeded()
        let shop = this.page.locator(`[data-marker="MainRetails Card ${shopMarker}"]`)
        await shop.scrollIntoViewIfNeeded()
        const [newPage] = await Promise.all([
            this.page.context().waitForEvent('page'),
            shop.click()
        ])
        await newPage.waitForLoadState('load')
        return newPage
    }

    async goto(url: string): Promise<void> {
        await super.goto(url)
        await this.homeRetails.waitFor({'state':'visible'})
    }

}