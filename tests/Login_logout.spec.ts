import { test, expect } from "../test-options";

test.describe('Login|Logout functionality', () => {

    test('Login_Logout', { tag: '@login' }, async ({ app, ZAKAZ }) => {
        await test.step('open site with saved storage state', async () => {
            await app.goto(ZAKAZ);
            await app.page.waitForTimeout(2000)
            await app.myAccount.openMyAccount()
            await app.page.waitForTimeout(2000)
        });
    });

});
