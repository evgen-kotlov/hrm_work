import { test, expect } from '../fixtures/test.fixture';

test.describe('Авторизация', () => {
  test('Успешный вход администратора @smoke @regress', async ({ loginPage, page }) => {
    await test.step('Открыть страницу логина', async () => {
      await loginPage.goto();
    });
    await test.step('Ввести учетные данные администратора', async () => {
      await loginPage.login('Admin', 'admin123');
    });
    await test.step('Проверить, что открылась панель управления', async () => {
      await expect(page.locator('.dashboard')).toBeVisible();
      await expect(page.locator('.user-role')).toHaveText('Administrator');
    });
  });

  test('Успешный вход обычного пользователя @smoke @regress', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login('User', 'user123');
    await expect(page.locator('.dashboard')).toBeVisible();
    await expect(page.locator('.user-role')).toHaveText('User');
  });

  test('Неуспешный вход с неверным паролем @regress', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('Admin', 'wrongpass');
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toHaveText('Invalid credentials. Please try again.');
  });

  test('Выход из системы @smoke', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login('Admin', 'admin123');
    await page.locator('.user-menu button:has-text("Logout")').click();
    await expect(loginPage.page.locator('.login-container')).toBeVisible();
  });
});