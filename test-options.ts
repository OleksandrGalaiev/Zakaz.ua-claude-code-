import { test as base } from '@playwright/test';
import { Pages } from './pom/Pages';


export type TestFixtures = {
  app: Pages;
  ZAKAZ: string
};

export const test = base.extend<TestFixtures>({
  app: async ({ page }, use) => {
    const app = new Pages(page);
    await use(app);
  },
  ZAKAZ:['',{option:true}]
});

export { expect } from '@playwright/test';
