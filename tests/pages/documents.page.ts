import { Page, Locator } from '@playwright/test';
import { step } from '../utils/decorators';
import * as path from 'path';

export class DocumentsPage {
  readonly page: Page;
  readonly pageHeader: Locator;
  readonly uploadDocBtn: Locator;
  readonly documentsTable: Locator;
  readonly documentRows: Locator;
  readonly modal: Locator;
  readonly documentNameInput: Locator;
  readonly documentCategorySelect: Locator;
  readonly fileInput: Locator;
  readonly saveDocumentBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeader = page.locator('.page-header h2');
    this.uploadDocBtn = page.locator('#uploadDocBtn');
    this.documentsTable = page.locator('#documentsList');
    this.documentRows = page.locator('#documentsList tr');
    this.modal = page.locator('#uploadModal');
    this.documentNameInput = page.locator('#documentName');
    this.documentCategorySelect = page.locator('#documentCategory');
    this.fileInput = page.locator('#modalFileInput');
    this.saveDocumentBtn = page.locator('.modal .save-btn');
  }

  @step('Перейти на страницу документов')
  async goto() {
    await this.page.locator('.sidebar li:has-text("Documents")').click();
    await this.page.waitForSelector('#documentsPage.active');
  }

  @step('Нажать кнопку "Upload Document"')
  async clickUpload() {
    await this.uploadDocBtn.click();
    await this.modal.waitFor({ state: 'visible' });
  }

  @step('Заполнить название документа: {0}')
  async fillDocumentName(name: string) {
    await this.documentNameInput.fill(name);
  }

  @step('Выбрать категорию: {0}')
  async selectCategory(category: string) {
    await this.documentCategorySelect.selectOption(category);
  }

  @step('Загрузить файл: {0}')
  async uploadFile(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
  }

  @step('Сохранить документ')
  async saveDocument() {
    await this.saveDocumentBtn.click();
    await this.modal.waitFor({ state: 'hidden' });
  }

  @step('Загрузить документ (комплексное действие)')
  async uploadDocument(name: string, category: string, filePath: string) {
    await this.clickUpload();
    await this.fillDocumentName(name);
    await this.selectCategory(category);
    await this.uploadFile(filePath);
    await this.saveDocument();
  }

  @step('Получить список документов в таблице')
  async getDocumentsList(): Promise<Array<{ name: string; category: string; size: string }>> {
    const rows = await this.documentRows.all();
    const documents = [];
    for (const row of rows) {
      const cells = row.locator('td');
      documents.push({
        name: await cells.nth(0).textContent() || '',
        category: await cells.nth(1).textContent() || '',
        size: await cells.nth(2).textContent() || '',
      });
    }
    return documents;
  }

  @step('Найти строку документа по имени {0}')
  async findDocumentRow(name: string, timeout = 5000): Promise<Locator | null> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const rows = await this.documentRows.all();
    for (const row of rows) {
      const cellText = await row.locator('td').first().textContent();
      if (cellText && cellText.includes(name)) {
        return row;
      }
    }
    await this.page.waitForTimeout(500);
  }
  return null;
}

  @step('Скачать документ с именем {0}')
  async downloadDocument(name: string) {
    const row = await this.findDocumentRow(name);
    if (!row) throw new Error(`Документ с именем "${name}" не найден`);
    const downloadPromise = this.page.waitForEvent('download');
    await row.locator('.view-btn:has-text("Download")').click();
    return downloadPromise;
  }

  @step('Удалить документ с именем {0}')
  async deleteDocument(name: string) {
    const row = await this.findDocumentRow(name);
    if (!row) throw new Error(`Документ с именем "${name}" не найден`);
    this.page.once('dialog', dialog => dialog.accept());
    await row.locator('.delete-btn').click();
  }
}