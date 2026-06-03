import { Locator, Page } from "playwright";
import { BasePage } from "./BasePage";


export class ExternalPage extends BasePage{
    chainHeader: Locator

    constructor(page:Page){
        super(page)
        this.chainHeader = page.locator('[data-marker="ChainHeader"]')
    }

    async getShopTitleName(){
        let shopLogo = await this.page.locator('//div[@data-marker="Logo"]//img')
        let titleName = await shopLogo.getAttribute('title')
        return titleName
    }

    async goto(url: string): Promise<void> {
        super.goto(url)
        await this.chainHeader.waitFor({'state':'visible'})
    }
}