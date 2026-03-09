import { Page, Locator, FrameLocator } from '@playwright/test';
import { step } from '../utils/decorators';
export class DashboardPage {
  readonly page: Page;
  readonly headerTitle: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly sidebarLinks: Locator;
  readonly totalEmployeesStat: Locator;
  readonly activeEmployeesStat: Locator;
  readonly departmentsStat: Locator;
  readonly pendingTasksStat: Locator;
  readonly iframe: FrameLocator;

  constructor(page: Page) {
    this.page = page;
    this.headerTitle = page.locator('.header h2');
    this.userMenu = page.locator('.user-menu');
    this.logoutButton = page.locator('.user-menu button:has-text("Logout")');
    this.sidebarLinks = page.locator('.sidebar li');
    this.totalEmployeesStat = page.locator('#totalEmployees');
    this.activeEmployeesStat = page.locator('#activeEmployees');
    this.departmentsStat = page.locator('#totalDepartments');
    this.pendingTasksStat = page.locator('#pendingTasks');
    this.iframe = page.frameLocator('#dashboardFrame');
  }

  @step('Дождаться загрузки дашборда')
  async waitForDashboard() {
    await this.page.waitForSelector('.dashboard');
  }

  @step('Нажать на пункт меню "{0}"')
  async clickSidebarItem(itemName: string) {
    await this.sidebarLinks.filter({ hasText: itemName }).click();
  }

  @step('Выйти из системы')
  async logout() {
    await this.logoutButton.click();
  }

  @step('Получить количество сотрудников на дашборде')
  async getTotalEmployees() {
    const text = await this.totalEmployeesStat.textContent();
    return parseInt(text || '0', 10);
  }
    @step('Получить количество активных сотрудников')
  async getActiveEmployees(): Promise<number> {
    const text = await this.activeEmployeesStat.textContent();
    return parseInt(text || '0', 10);
  }

  @step('Переключить содержимое iframe')
  async changeIframeSource() {
    await this.page.locator('button:has-text("Change Iframe Content")').click();
  }

  
}