import { test } from "../test-options"
import { expect } from "@playwright/test"

test.describe('Main page redirect tests', async () => {

    test('Check redirect from main page to promotions page via header button',
        { tag: '@mainPage' }, async ({ app, ZAKAZ }) => {
        await test.step('Open zakaz main page', async () => {
            await app.goto(ZAKAZ)
        })
        await test.step('Click on Promotions button in header', async () => {
            await app.header.promotionsLink.click()
        })
        await test.step('Check url of redirected page', async () => {
            await app.promotionalPage.promotionsBlock.waitFor({'state':'visible'})
            expect(await app.getCurrentUrl()).toContain('akciyni_tovary')
        })
        await test.step('Check that promotions block is displayed', async () => {
            await expect(app.promotionalPage.promotionsBlock).toBeVisible()
        })
    })

})
