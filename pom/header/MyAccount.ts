import { Locator, Page } from "@playwright/test";


export class MyAccount{
    private readonly page: Page
    private readonly accountDropdownTrigger: Locator
    private readonly myAddressesLink: Locator
    private readonly addressCard: Locator
    private readonly addressCardHeader: Locator
    private readonly settingsEmailField: Locator
    private readonly settingsPhoneField: Locator
    private readonly settingsNameField: Locator
    settingsBlock: Locator

    constructor(page: Page){
        this.page = page
        this.accountDropdownTrigger = page.locator("//span[contains(@class, 'AccountButtonContent')]").nth(1)
        this.myAddressesLink = page.getByRole('link', { name: 'Мої адреси' })
        this.addressCard = page.locator('[data-marker="Address"]')
        this.addressCardHeader = this.addressCard.locator('[data-marker="Address title"]')
        this.settingsEmailField = page.locator('//p[@data-marker="email"]')
        this.settingsPhoneField = page.locator('//p[@data-marker="Login phone"]')
        this.settingsNameField = page.locator('//p[@data-marker="name"]')
        this.settingsBlock = page.locator("//div[contains(@class, 'LoginSettings')]")
    }

    async openMyAccountHeaderMenuPoint(menuPoint: string){
        await this.accountDropdownTrigger.click()
        await this.page.locator("//div[contains(@class, 'AccountNavigation__listItem')]", {hasText:menuPoint}).click()
    }

    async chooseMyAccountSideBarMenuPoint(menuPoint: string){
        await this.page.locator('//div[@data-maker="Account sidebar"]//div[@class="AccountNavigation__listItem"]', {hasText:menuPoint}).click()
    }


    async getFirstAddressHeader(){
        let firstAddress = this.page.locator('[data-marker="Address item"]').first()
        let orderAddress = await firstAddress.locator('.AccountAddressItem__title').textContent()
        return orderAddress
    }

    async getSettingsEmail(){
        return await this.settingsEmailField.textContent()
    }

    async getSettingsPhone(){
        return await this.settingsPhoneField.textContent()
    }

    async getSettingsName(){
        return await this.settingsNameField.textContent()
    }
}
