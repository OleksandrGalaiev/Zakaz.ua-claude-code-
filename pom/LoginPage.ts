import { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly dialog: Locator;
  readonly phoneInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog');
    this.phoneInput = this.dialog.locator('input[type="tel"]');
    this.passwordInput = this.dialog.locator('input[type="password"]');
    this.submitButton = this.dialog.locator('button[data-marker="Submit"]');
  }

  async login(rawLogin: string, password: string) {
    //const phoneNumber = rawLogin.replace(/^\+?380/, '');
    await this.phoneInput.pressSequentially(rawLogin,{'delay':100});
    await this.passwordInput.pressSequentially(password, {'delay':100});
    await this.submitButton.click();
  }
}
