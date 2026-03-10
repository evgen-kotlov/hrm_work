import { test as base, Page, expect } from '@playwright/test'; // ✅ добавили Page
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { EmployeesPage } from '../pages/employees.page';
import { DocumentsPage } from '../pages/documents.page';
import { ReportsPage } from '../pages/reports.page';
import { SettingsPage } from '../pages/settings.page';
import { ApiClient } from '../api/api-client';

type MyFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  employeesPage: EmployeesPage;
  documentsPage: DocumentsPage;
  reportsPage: ReportsPage;
  settingsPage: SettingsPage;
  apiClient: ApiClient;
  adminContext: { page: Page; apiClient: ApiClient };
  userContext: { page: Page; apiClient: ApiClient };
};

export const test = base.extend<MyFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  employeesPage: async ({ page }, use) => {
    await use(new EmployeesPage(page));
  },
  documentsPage: async ({ page }, use) => {
    await use(new DocumentsPage(page));
  },
  reportsPage: async ({ page }, use) => {
    await use(new ReportsPage(page));
  },
  settingsPage: async ({ page }, use) => {
    await use(new SettingsPage(page));
  },
  apiClient: async ({}, use) => {
    const client = new ApiClient('http://77.222.42.248:3001');
    await use(client);
  },

  adminContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('Admin', 'admin123');
    await page.waitForSelector('.dashboard');

    const apiClient = new ApiClient('http://77.222.42.248:3001');
    await apiClient.login('Admin', 'admin123');

    await use({ page, apiClient });
    await context.close();
  },

  userContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('User', 'user123');
    await page.waitForSelector('.dashboard');

    const apiClient = new ApiClient('http://77.222.42.248:3001');
    await apiClient.login('User', 'user123');

    await use({ page, apiClient });
    await context.close();
  },
});

export { expect };