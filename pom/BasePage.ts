import { Page } from "playwright"
import { MainPage } from "./MainPage"


export class BasePage{
    protected page: Page

    constructor(page:Page){
        this.page = page
    }

    async goto(url:string){
        await this.page.goto(url)
    }

    async getCurrentUrl(){
        return await this.page.url()
    }

}

