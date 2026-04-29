import { Page } from "playwright";


export class ExternalPage{
    page: Page

    constructor(page:Page){
        this.page = page
    }

    async getShopTitleName(){
        let shopLogo = await this.page.locator('//div[@data-marker="Logo"]//img')
        let titleName = await shopLogo.getAttribute('title')
        return titleName
    }
}