import { test as base } from '@playwright/test';
import { BaseTest } from './pom/BaseTest';


export type TestFixtures = {
  app: BaseTest;
  ZAKAZ: string
};

export const test = base.extend<TestFixtures>({
  app: async ({ page }, use) => {
    const app = new BaseTest(page);
    await use(app);
  },
  ZAKAZ:['',{option:true}]
});

export { expect } from '@playwright/test';
