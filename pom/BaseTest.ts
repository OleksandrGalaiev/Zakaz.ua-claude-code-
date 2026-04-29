import {Page} from "@playwright/test"
import { HeaderPage } from "./header/HeaderPage"
import { MainPage } from "./MainPage"
import { LoginPage } from "./LoginPage"
import { MyAccount } from "./header/MyAccount"
import { ExternalPage } from "./externalShop"
import { PromotionsPage } from "./PromotionsPage"


export class BaseTest{
    page: Page
    mainPage: MainPage
    header: HeaderPage
    loginPage: LoginPage
    myAccount: MyAccount
    externalShop: ExternalPage
    promotionalPage: PromotionsPage

    constructor(page:Page){
        this.page = page
        this.mainPage = new MainPage(this.page)
        this.header = new HeaderPage(this.page)
        this.loginPage = new LoginPage(this.page)
        this.myAccount = new MyAccount(this.page)
        this.externalShop = new ExternalPage(this.page)
        this.promotionalPage = new PromotionsPage(this.page)
    }

    async goto(url:string){
        await this.page.goto(url)
        await this.mainPage.homeRetails.waitFor({state:'visible'})
    }

    async getCurrentUrl(){
        return await this.page.url()
    }


}