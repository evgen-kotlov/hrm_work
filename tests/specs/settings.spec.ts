import { test, expect } from '../fixtures/test.fixture';
import { SettingsPage } from '../pages/settings.page';

test.describe('Настройки', () => {
  test('Администратор может изменить название компании @regress', async ({ adminContext }) => {
    const { page } = adminContext;
    const settingsPage = new SettingsPage(page);

    await test.step('Перейти на страницу настроек', async () => {
      await settingsPage.goto();
    });

    await test.step('Изменить название компании', async () => {
      await settingsPage.fillCompanyName('Новое название');
    });

    await test.step('Сохранить настройки', async () => {
      await settingsPage.saveSettings();
    });

    await test.step('Проверить, что название сохранилось', async () => {
      const companyName = await settingsPage.getCompanyName();
      expect(companyName).toBe('Новое название');
    });
  });

  test('Обычный пользователь не имеет доступа к настройкам @regress', async ({ userContext }) => {
    const { page } = userContext;
    const settingsPage = new SettingsPage(page);

    await test.step('Попытаться открыть страницу настроек', async () => {
      await settingsPage.goto();
    });

    await test.step('Проверить отображение сообщения об отказе в доступе', async () => {
      const isDeniedVisible = await settingsPage.isAccessDeniedVisible();
      expect(isDeniedVisible).toBeTruthy();
    });
  });
});