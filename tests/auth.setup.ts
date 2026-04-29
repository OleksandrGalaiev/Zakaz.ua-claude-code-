import { test as setup, expect } from '../test-options';
import { STORAGE_STATE } from '../playwright.config';

setup('authenticate', async ({ app, ZAKAZ, page}) => {
  const login = process.env.USER_LOGIN;
  const password = process.env.USER_PASSWORD;

  if (!login || !password) {
    throw new Error('USER_LOGIN and USER_PASSWORD must be set in .env');
  }
  await app.goto(ZAKAZ);
  await app.header.loginButton.click();
  await expect(app.loginPage.dialog).toBeVisible();

  await app.loginPage.login(login, password);
  await expect(app.loginPage.dialog).toBeHidden();

  await page.context().storageState({ path: STORAGE_STATE });
});
