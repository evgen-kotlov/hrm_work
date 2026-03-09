import { test, expect } from '../fixtures/test.fixture';
import { ReportsPage } from '../pages/reports.page';

test.describe('Отчеты', () => {
  test('Генерация отчета по сотрудникам в PDF @smoke @regress', async ({ adminContext }) => {
    const { page } = adminContext;
    const reportsPage = new ReportsPage(page);

    await test.step('Перейти на страницу отчетов', async () => {
      await reportsPage.goto();
    });

    await test.step('Выбрать тип отчета "employee" и формат "pdf"', async () => {
      await reportsPage.generateReport('employee', 'pdf');
    });

    await test.step('Проверить, что отчет отображается и содержит ожидаемый заголовок', async () => {
      const reportText = await reportsPage.getReportText();
      expect(reportText).toContain('Employee Report');
    });
  });
});