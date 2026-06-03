import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage{
  readonly dialog: Locator;
  readonly phoneInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page)
    this.dialog = page.getByRole('dialog');
    this.phoneInput = this.dialog.locator('input[type="tel"]');
    this.passwordInput = this.dialog.locator('input[type="password"]');
    this.submitButton = this.dialog.locator('button[data-marker="Submit"]');
  }

  async login(rawLogin: string, password: string) {
    await this.phoneInput.click()
    await this.phoneInput.pressSequentially(rawLogin,{'delay':100});
    await this.passwordInput.pressSequentially(password, {'delay':100});
    await this.submitButton.click();
  }
}
