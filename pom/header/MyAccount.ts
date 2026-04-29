import { Page } from "playwright";


export class MyAccount{
    page:Page

    constructor(page:Page){
        this.page = page
    }
    async openMyAccount(){
        await this.page.locator("//div[contains(@data-marker, 'account')]").first().click()
    }
}