import { Locator, Page } from '@playwright/test';

export class HeaderPage {
  readonly page: Page;
  readonly root: Locator;
  readonly logo: Locator;
  readonly catalogButton: Locator;
  readonly supportArmyLink: Locator;
  
  readonly languageTitle: Locator
  readonly languageSwitcher: Locator;

  readonly partnersDropdown: Locator;
  readonly vacanciesLink: Locator;
  readonly promotionsLink: Locator;
  readonly contactsLink: Locator;

  readonly loginButton: Locator;
  readonly accountDropDown: Locator
  readonly accountLoginedBtn: Locator
  readonly headerLoginBlock: Locator
  readonly productCatalog: Locator
  readonly productCatalogItem: Locator

  constructor(page: Page) {
    this.page = page;
    this.root = page.locator('#header');
    this.logo = page.locator('#header').getByRole('link', { name: 'Zakaz logo' });
    this.catalogButton = page.locator('//button[@data-marker="sidebar-button"]');
    this.supportArmyLink = page.locator('[data-marker="zsu-help"]');
    this.languageSwitcher = page.locator('[data-marker="lang"]');

    this.languageTitle = page.locator('//div[@data-marker="lang-button"]//span[@class="Dropdown__label"]')

    this.partnersDropdown = page.locator("//span[text()='For partners']");
    this.vacanciesLink = page.locator("//a[text()='Vacancies']").first();
    this.promotionsLink = this.root.locator("a[href*='akciyni_tovary']").first();
    this.contactsLink = page.getByRole('link', { name: 'Contacts' }).first();

    this.loginButton = page.getByTestId('login-button');
    this.accountDropDown = page.locator('a[data-marker*="Header"][href*="profile"]');
    this.accountLoginedBtn = page.locator("//div[contains(@class, 'HeaderLogin__accountDropdown')]//span[text()='Account']");
    this.headerLoginBlock = page.locator(".HeaderLogin__login")
    this.productCatalog = page.locator('[data-testid="categoriesMenuButton"]')
    this.productCatalogItem = page.locator("//span[contains(@class, 'CategoriesMenuListItem__link_withChildren')]")
  }

    async swtichToLanguage(language: string){
      if(await this.languageTitle.textContent() !== language){
        await this.languageSwitcher.click()
        await this.page.getByRole('link', { name: language, exact: true }).click();
      }
    }

    async openPromotionsPage(){
        const [newPage] = await Promise.all([
            this.page.context().waitForEvent('page'),
            this.promotionsLink.click()
        ])
        await newPage.waitForLoadState('load')
        return newPage
    }

    async openCategoryMenupoint(categoryName:string){
      let menuItem = await this.productCatalogItem.filter({hasText:categoryName})
      await menuItem.scrollIntoViewIfNeeded()
      await menuItem.click()
    }

}
