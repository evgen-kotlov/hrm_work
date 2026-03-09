import { test, expect } from '../fixtures/test.fixture';
import { DocumentsPage } from '../pages/documents.page';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testFilePath = path.join(process.cwd(), 'test-files', 'sample.pdf');

test.describe('Документы', () => {
//   test('Загрузка документа администратором @smoke @regress', async ({ adminContext }) => {
//     const { page } = adminContext;
//     const documentsPage = new DocumentsPage(page);
    
//     await documentsPage.goto();
//     await documentsPage.uploadDocument('Тестовый документ', 'HR', testFilePath);
    
//     const docRow = await documentsPage.findDocumentRow('Тестовый документ');
//     expect(docRow).not.toBeNull();
//     await expect(docRow!).toBeVisible();
//   });

  test('Загрузка документа администратором @smoke @regress', async ({ adminContext }) => {
  const { page } = adminContext;
  const documentsPage = new DocumentsPage(page);
  
  await documentsPage.goto();
  await documentsPage.uploadDocument('sample', 'HR', testFilePath);
  
  // Ждём появления документа в таблице (с повторными попытками)
  const docRow = await documentsPage.findDocumentRow('sample', 10000);
  expect(docRow).not.toBeNull();
  await expect(docRow!).toBeVisible();
});

  test('Скачивание документа @regress', async ({ adminContext }) => {
    const { page } = adminContext;
    const documentsPage = new DocumentsPage(page);
    
    // Предварительно загружаем документ (можно через API для надёжности)
    // Используем UI для загрузки
    await documentsPage.goto();
    await documentsPage.uploadDocument('Документ для скачивания', 'HR', testFilePath);
    
    const downloadPromise = documentsPage.downloadDocument('Документ для скачивания');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('sample.pdf');
    // Можно проверить, что файл скачался (размер > 0)
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
  });

  test('Удаление документа @regress', async ({ adminContext }) => {
    const { page } = adminContext;
    const documentsPage = new DocumentsPage(page);
    
    await documentsPage.goto();
    await documentsPage.uploadDocument('Документ для удаления', 'HR', testFilePath);
    
    const docRow = await documentsPage.findDocumentRow('Документ для удаления');
    expect(docRow).not.toBeNull();
    
    await documentsPage.deleteDocument('Документ для удаления');
    
    // Проверяем, что документ исчез
    const deletedRow = await documentsPage.findDocumentRow('Документ для удаления');
    expect(deletedRow).toBeNull();
  });

  test('Обычный пользователь не видит кнопку загрузки @regress', async ({ userContext }) => {
    const { page } = userContext;
    const documentsPage = new DocumentsPage(page);
    
    await documentsPage.goto();
    await expect(page.locator('#uploadDocBtn')).toBeHidden();
  });
});