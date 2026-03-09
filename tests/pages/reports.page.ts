import { Page, Locator } from '@playwright/test';
import { step } from '../utils/decorators';

export class ReportsPage {
  readonly page: Page;
  readonly pageHeader: Locator;
  readonly reportTypeSelect: Locator;
  readonly reportFormatSelect: Locator;
  readonly generateBtn: Locator;
  readonly reportOutput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeader = page.locator('.page-header h2');
    this.reportTypeSelect = page.locator('#reportType');
    this.reportFormatSelect = page.locator('#reportFormat');
    this.generateBtn = page.locator('#generateReportBtn');
    this.reportOutput = page.locator('#reportOutput');
  }

  @step('Перейти на страницу отчетов')
  async goto() {
    await this.page.locator('.sidebar li:has-text("Reports")').click();
    await this.page.waitForSelector('#reportsPage.active');
  }

  @step('Выбрать тип отчета: {0}')
  async selectReportType(type: string) {
    await this.reportTypeSelect.selectOption(type);
  }

  @step('Выбрать формат отчета: {0}')
  async selectReportFormat(format: string) {
    await this.reportFormatSelect.selectOption(format);
  }

  @step('Нажать кнопку "Generate Report"')
  async clickGenerate() {
    await this.generateBtn.click();
  }

  @step('Сгенерировать отчет (тип: {0}, формат: {1})')
  async generateReport(type: string, format: string) {
    await this.selectReportType(type);
    await this.selectReportFormat(format);
    await this.clickGenerate();
  }

  @step('Получить текст отчета')
  async getReportText(): Promise<string> {
    await this.reportOutput.waitFor({ state: 'visible' });
    return (await this.reportOutput.textContent()) || '';
  }

  @step('Дождаться появления отчета')
  async waitForReport() {
    await this.reportOutput.waitFor({ state: 'visible' });
  }

  @step('Проверить, что отчет отображается (возвращает boolean)')
  async isReportVisible(): Promise<boolean> {
    return this.reportOutput.isVisible();
  }
}