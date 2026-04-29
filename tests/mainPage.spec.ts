import { ExternalPage } from "../pom/externalShop"
import {test} from "../test-options"
import {HomeDelivery, LanguageSwitcher} from "../types/mainPageTypes"
import { expect, Page } from "playwright/test"

test.describe('Main page tests', async()=>{

    const shop: HomeDelivery[] = [
        {'shopName':"WINETIME",'shopLogoName':'WINETIME'},
        {'shopName':"Auchan",'shopLogoName':'Auchan'},
        {'shopName':"METRO",'shopLogoName':'METRO'},
        {'shopName':"NOVUS",'shopLogoName':'NOVUS'},
        {'shopName':"ULTRAMARKET",'shopLogoName':'ULTRAMARKET'},
        {'shopName':"Біотус",'shopLogoName':'Біотус'},
        {'shopName':"MasterZoo",'shopLogoName':'MasterZoo'},
        {'shopName':"Торба",'shopLogoName':'Торба'},
        {'shopName':"ЕКО Маркет",'shopLogoName':'ЕКО Маркет'},
        {'shopName':"AlcoHub",'shopLogoName':'AlcoHub'},
        {'shopName':"За Раз",'shopLogoName':'За Раз'},
        {'shopName':"МегаМаркет",'shopLogoName':'МегаМаркет'},
        {'shopName':"Ідеал",'shopLogoName':'Ідеал'},
        {'shopName':"Grono",'shopLogoName':'Grono'},
        {'shopName':"Чудо Маркет",'shopLogoName':'Чудо Маркет'},
        {'shopName':"Восторг",'shopLogoName':'Восторг'},
        {'shopName':"КОСМОС",'shopLogoName':'КОСМОС'},
        {'shopName':"Таврія В",'shopLogoName':'Таврія В'},
    ]
    for(const {shopName, shopLogoName}of shop){
        test(`Check correct redirect from zakaz main page to ${shopName} external shop main page`, 
            {tag:'@mainPage'}, async({app, ZAKAZ})=>{
            let externalShop: ExternalPage
            await test.step(`Open main page and click ${shopName} btn`, async()=>{
                await app.goto(ZAKAZ)
                let externalPage = await app.mainPage.openDeliveryShop(shopName)
                externalShop = new ExternalPage(externalPage)
            })
            await test.step('Check logo on external mainpage', async()=>{
                expect(await externalShop.getShopTitleName()).toContain(shopLogoName)
            })
        })
    }

    const languages: LanguageSwitcher[] = [
        {'language':'Рус', 'loginBtnText':'Войти'},
        {'language':'Укр', 'loginBtnText':'Увійти'},
        {'language':'Eng', 'loginBtnText':'Log in'},
    ]
    for(const {language, loginBtnText} of languages){
        test(`check redirect for ${language}`, {tag:'@mainPage'}, async({app, ZAKAZ})=>{
            await test.step(`Open main page and redirect to ${language}`,async()=>{
                await app.goto(ZAKAZ)
                await app.header.swtichToLanguage(language)
            })
            await test.step('Check login btn localization', async()=>{
                expect(await app.header.loginButton.textContent()).toEqual(loginBtnText)
            })
    })
    }

})