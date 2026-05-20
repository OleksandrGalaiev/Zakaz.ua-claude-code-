import { Locator, Page } from "@playwright/test";


export class MyAccount{
    readonly page: Page
    readonly accountDropdownTrigger: Locator
    readonly myAddressesLink: Locator
    readonly addressCard: Locator
    readonly addressCardHeader: Locator

    constructor(page: Page){
        this.page = page
        this.accountDropdownTrigger = page.locator("//div[contains(@data-marker, 'account')]").first()
        this.myAddressesLink = page.getByRole('link', { name: 'Мої адреси' })
        this.addressCard = page.locator('[data-marker="Address"]')
        this.addressCardHeader = this.addressCard.locator('[data-marker="Address title"]')
    }

    async openMyAccount(){
        await this.accountDropdownTrigger.click()
    }

    async openMyAddresses(){
        await this.myAddressesLink.click()
    }

    async getFirstAddressHeader(){
        return (await this.addressCardHeader.first().textContent())?.trim() ?? ''
    }
}
