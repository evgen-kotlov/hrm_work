import { Page, Locator } from '@playwright/test';
import { step } from '../utils/decorators'; // если используете декораторы

export class AboutPage {
  readonly page: Page;
  readonly pageHeader: Locator;
  readonly systemOverview: Locator;
  readonly userRoles: Locator;
  readonly features: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeader = page.locator('.page-header h2');
    this.systemOverview = page.locator('.about-section:has-text("System Overview")');
    this.userRoles = page.locator('.about-section:has-text("User Roles & Permissions")');
    this.features = page.locator('.about-section:has-text("Core Features")');
  }

  @step('Перейти на страницу "О системе"')
  async goto() {
    await this.page.locator('.sidebar li:has-text("About")').click();
    await this.page.waitForSelector('#aboutPage.active');
  }

  @step('Получить текст заголовка страницы')
  async getHeaderText(): Promise<string> {
    return (await this.pageHeader.textContent()) || '';
  }

  @step('Проверить видимость раздела "Обзор системы" (возвращает boolean)')
  async isOverviewVisible(): Promise<boolean> {
    return this.systemOverview.isVisible();
  }

  @step('Получить текст раздела с ролями пользователей')
  async getUserRolesText(): Promise<string> {
    return (await this.userRoles.textContent()) || '';
  }

  @step('Получить список основных функций')
  async getFeaturesList(): Promise<string[]> {
    const items = await this.page.locator('.feature-list li').allTextContents();
    return items;
  }
}