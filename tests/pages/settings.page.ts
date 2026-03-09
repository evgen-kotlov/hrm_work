import { Page, Locator } from '@playwright/test';
import { step } from '../utils/decorators';

export class SettingsPage {
  readonly page: Page;
  readonly pageHeader: Locator;
  readonly companyNameInput: Locator;
  readonly timezoneSelect: Locator;
  readonly languageSelect: Locator;
  readonly dateFormatSelect: Locator;
  readonly saveBtn: Locator;
  readonly resetBtn: Locator;
  readonly accessDeniedMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeader = page.locator('.page-header h2');
    this.companyNameInput = page.locator('#companyName');
    this.timezoneSelect = page.locator('#timezone');
    this.languageSelect = page.locator('#language');
    this.dateFormatSelect = page.locator('#dateFormat');
    this.saveBtn = page.locator('.save-btn:has-text("Save Settings")');
    this.resetBtn = page.locator('.cancel-btn:has-text("Reset")');
    this.accessDeniedMessage = page.locator('#accessDeniedPage');
  }

  @step('Перейти на страницу настроек')
  async goto() {
    await this.page.locator('.sidebar li:has-text("Settings")').click();
    // Ждем либо страницу настроек, либо сообщение об отказе в доступе
    await Promise.race([
      this.page.waitForSelector('#settingsPage.active'),
      this.page.waitForSelector('#accessDeniedPage.active')
    ]);
  }

  @step('Заполнить название компании: {0}')
  async fillCompanyName(name: string) {
    await this.companyNameInput.fill(name);
  }

  @step('Выбрать часовой пояс: {0}')
  async selectTimezone(timezone: string) {
    await this.timezoneSelect.selectOption(timezone);
  }

  @step('Выбрать язык: {0}')
  async selectLanguage(language: string) {
    await this.languageSelect.selectOption(language);
  }

  @step('Выбрать формат даты: {0}')
  async selectDateFormat(format: string) {
    await this.dateFormatSelect.selectOption(format);
  }

  @step('Сохранить настройки')
  async saveSettings() {
    await this.saveBtn.click();
  }

  @step('Сбросить настройки')
  async resetSettings() {
    await this.resetBtn.click();
  }

  @step('Получить текущее название компании')
  async getCompanyName(): Promise<string> {
    return (await this.companyNameInput.inputValue()) || '';
  }

  @step('Получить выбранный часовой пояс')
  async getSelectedTimezone(): Promise<string> {
    return await this.timezoneSelect.inputValue();
  }

  @step('Проверить, отображается ли сообщение об отказе в доступе')
  async isAccessDeniedVisible(): Promise<boolean> {
    return this.accessDeniedMessage.isVisible();
  }

  @step('Дождаться загрузки страницы настроек (для администратора)')
  async waitForSettingsLoaded() {
    await this.page.waitForSelector('#settingsPage.active');
    await this.companyNameInput.waitFor({ state: 'visible' });
  }
}