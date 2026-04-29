import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export const STORAGE_STATE = path.resolve(__dirname, 'auth/user.json');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    locale: 'en',
    trace: 'on-first-retry',
    ZAKAZ: 'https://zakaz.ua/uk/',
    timezoneId: 'Europe/Kyiv',
    geolocation: { latitude: 50.4501, longitude: 30.5234 },
    permissions: ['geolocation'],
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'authorize',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
    {
      name: 'incognito',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
