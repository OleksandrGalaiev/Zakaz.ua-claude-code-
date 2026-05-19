import { ExternalPage } from "../pom/externalShop"
import {test} from "../test-options"
import {HomeDelivery, LanguageSwitcher} from "../types/mainPageTypes"
import { expect, Page } from "playwright/test"

test.describe('Main page tests',{tag:['@auth']}, async()=>{

    const shop: HomeDelivery[] = [
        {'shopName':"WINETIME",'shopMarker':'winetime','shopLogoName':'WINETIME'},
        {'shopName':"Auchan",'shopMarker':'auchan','shopLogoName':'Auchan'},
        {'shopName':"METRO",'shopMarker':'metro','shopLogoName':'METRO'},
        {'shopName':"NOVUS",'shopMarker':'novus','shopLogoName':'NOVUS'},
        {'shopName':"ULTRAMARKET",'shopMarker':'ultramarket','shopLogoName':'ULTRAMARKET'},
        {'shopName':"Біотус",'shopMarker':'biotus','shopLogoName':'Біотус'},
        {'shopName':"MasterZoo",'shopMarker':'masterzoo','shopLogoName':'MasterZoo'},
        {'shopName':"Торба",'shopMarker':'torba','shopLogoName':'Торба'},
        {'shopName':"ЕКО Маркет",'shopMarker':'ekomarket','shopLogoName':'ЕКО Маркет'},
        {'shopName':"AlcoHub",'shopMarker':'alcohub','shopLogoName':'AlcoHub'},
        {'shopName':"За Раз",'shopMarker':'zaraz','shopLogoName':'За Раз'},
        {'shopName':"МегаМаркет",'shopMarker':'megamarket','shopLogoName':'МегаМаркет'},
        {'shopName':"Ідеал",'shopMarker':'ideal','shopLogoName':'Ідеал'},
        {'shopName':"Grono",'shopMarker':'grono','shopLogoName':'Grono'},
        {'shopName':"Чудо Маркет",'shopMarker':'chudomarket','shopLogoName':'Чудо Маркет'},
        {'shopName':"Восторг",'shopMarker':'vostorg','shopLogoName':'Восторг'},
        {'shopName':"КОСМОС",'shopMarker':'cosmos','shopLogoName':'КОСМОС'},
        {'shopName':"Таврія В",'shopMarker':'tavriav','shopLogoName':'Таврія В'},
    ]
    for(const {shopName, shopMarker, shopLogoName}of shop){
        test(`Check correct redirect from zakaz main page to ${shopName} external shop main page`,
            {tag:'@mainPage'}, async({app, ZAKAZ})=>{
            let externalShop: ExternalPage
            await test.step(`Open main page and click ${shopName} btn`, async()=>{
                await app.goto(ZAKAZ)
                let externalPage = await app.mainPage.openDeliveryShop(shopMarker)
                externalShop = new ExternalPage(externalPage)
            })
            await test.step('Check logo on external mainpage', async()=>{
                expect(await externalShop.getShopTitleName()).toContain(shopLogoName)
            })
        })
    }
})

test.describe('Main page tests without storage state', {tag:'@incognito'}, async()=>{
    
    const expectedCities: string[] = [
        'Київ','Вінниця','Дніпро','Житомир','Запоріжжя',
        'Івано-Франківськ','Кривий Ріг','Львів','Одеса','Полтава',
        'Рівне','Харків','Чернівці',
    ]
    test('Check that city selector shows the list of available cities',
        {tag:'@debug'}, async({app, ZAKAZ})=>{
        await test.step('Open main page', async()=>{
            await app.goto(ZAKAZ)
        })
        await test.step('Click on location button in header', async()=>{
            await app.header.openCitySelector()
        })
        await test.step('Check city selector modal is visible', async()=>{
            await expect(app.header.cityModal).toBeVisible()
        })
        await test.step('Check list of cities matches expected', async()=>{
            const cities = await app.header.getAvailableCities()
            expect(cities).toEqual(expectedCities)
        })
    })

    for(const city of expectedCities){
        test(`Switch delivery city to ${city}`, async({app, ZAKAZ})=>{
            await test.step('Open main page', async()=>{
                await app.goto(ZAKAZ)
            })
            await test.step('Click on City button in header', async()=>{
                await app.header.citySelectButton.click()
            })
            await test.step('Wait for city selector popup', async()=>{
                await app.header.cityModal.waitFor({state:'visible'})
            })
            await test.step(`Choose city "${city}"`, async()=>{
                await app.header.chooseCity(city)
            })
            await test.step(`Assert "${city}" is visible on the city button`, async()=>{
                await expect(app.header.citySelectButton).toHaveText(city)
            })
        })
    }

    const languages: LanguageSwitcher[] = [
        {'language':'Рус', 'loginBtnText':'Войти'},
        {'language':'Укр', 'loginBtnText':'Увійти'},
        {'language':'Eng', 'loginBtnText':'Log in'},
    ]
    for(const {language, loginBtnText} of languages){
        test(`check redirect for ${language}`, async({app, ZAKAZ})=>{
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
