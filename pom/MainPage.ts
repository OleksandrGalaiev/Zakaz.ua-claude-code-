import { Locator, Page } from "playwright";


export class MainPage {
    private page: Page
    homeRetails: Locator
    retailsInfoBlock: Locator

    constructor(page: Page){
        this.page = page
        this.homeRetails = page.locator("//div[contains(@class, 'HomeRetails')]")
        this.retailsInfoBlock = page.locator("//div[contains(@class, 'RetailsInfo')]").first()
    }

    async openDeliveryShop(shopName:string){
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

}