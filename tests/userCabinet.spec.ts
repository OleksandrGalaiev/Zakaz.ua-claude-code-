import {test, expect} from "../test-options"

test.describe('User Cabinet', {tag:'@auth'}, async()=>{

    test('First saved address contains "Воскресенська"',{tag:'@userCabinet'}, async({app, ZAKAZ})=>{
        await test.step('Open main page', async()=>{
            await app.goto(ZAKAZ)
        })
        await test.step('Open Account dropdown', async()=>{
            await app.myAccount.openMyAccount()
        })
        await test.step('Choose "My addresses"', async()=>{
            await app.myAccount.openMyAddresses()
            await app.myAccount.addressCard.first().waitFor({state:'visible'})
        })
        await test.step('Validate first address header includes "Воскресенська"', async()=>{
            const header = await app.myAccount.getFirstAddressHeader()
            expect(header).toContain('Воскресенська')
        })
    })

})
