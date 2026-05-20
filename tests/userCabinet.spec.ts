import {test, expect} from "../test-options"

test.describe('User Cabinet', {tag:'@auth'}, async()=>{

    test('First saved address contains "Воскресенська"',{tag:'@userCabinet'}, async({app, ZAKAZ})=>{
        await test.step('Open main page', async()=>{
            await app.goto(ZAKAZ)
        })
        await test.step('Open Account dropdown and choose My orders menu point', async()=>{
            await app.myAccount.openMyAccountHeaderMenuPoint('Мої замовлення')
        })
        await test.step('Choose "My addresses"', async()=>{
            await app.myAccount.chooseMyAccountSideBarMenuPoint('Адреси')
        })
        await test.step('Validate first address header includes "Воскресенська"', async()=>{
            expect(await app.myAccount.getFirstAddressHeader()).toContain('Воскресенська')
        })
    })

    test('Settings page displays correct user contacts',{tag:'@debug'}, async({app, ZAKAZ})=>{
        const expectedEmail = process.env.USER_EMAIL
        const expectedPhone = '+380 (93) 210 72 53'
        const expectedName = 'Александр'

        await test.step('Open main page', async()=>{
            await app.goto(ZAKAZ)
        })
        await test.step('Open Account dropdown and choose My orders menu point', async()=>{
            await app.myAccount.openMyAccountHeaderMenuPoint('Мої замовлення')
        })
        await test.step('Choose "Settings"', async()=>{
            await app.myAccount.chooseMyAccountSideBarMenuPoint('Налаштування')
        })
        await test.step('Validate email, phone and name on Settings page', async()=>{
            await app.myAccount.settingsBlock.waitFor({'state':'visible'})
            expect(await app.myAccount.settingsEmailField.textContent()).toEqual(expectedEmail)
            expect(await app.myAccount.settingsPhoneField.textContent()).toEqual(expectedPhone)
            expect(await app.myAccount.settingsNameField.textContent()).toEqual(expectedName)
        })
    })

})
