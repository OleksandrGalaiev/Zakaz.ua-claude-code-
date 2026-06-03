import { test, expect } from "../test-options";

test.describe('Login|Logout functionality', { tag: '@auth' }, () => {

    test('Login_Logout', { tag: '@login' }, async ({ app, ZAKAZ }) => {
        await test.step('open site with saved storage state', async () => {
            await app.mainPage.goto(ZAKAZ);
            await app.myAccount.openMyAccountHeaderMenuPoint('Вийти')
        })
        await test.step('Check visibility of login popup', async()=>{
            await app.header.loginButton.click()
            await expect(app.loginPage.dialog).toBeVisible()
        })
    });

});
