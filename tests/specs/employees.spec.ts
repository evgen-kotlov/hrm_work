import { test, expect } from '../fixtures/test.fixture';
import { EmployeesPage } from '../pages/employees.page';
import { faker } from '@faker-js/faker';

test.describe('Управление сотрудниками', () => {
  test.describe('Как администратор', () => {
    test.skip('Добавление нового сотрудника @smoke @regress', async ({ adminContext }) => {
      const { page } = adminContext;
      const employeesPage = new EmployeesPage(page);

      await test.step('Перейти на страницу добавления сотрудника', async () => {
        await employeesPage.goToAddEmployee();
      });

      const employee = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        department: 'IT',
        position: faker.person.jobTitle(),
      };

      await test.step('Заполнить форму', async () => {
        await employeesPage.fillEmployeeForm(employee);
      });

      await test.step('Сохранить сотрудника', async () => {
        await employeesPage.saveEmployee();
      });

      await test.step('Проверить, что сотрудник появился в списке', async () => {
        await employeesPage.waitForPage();
        // Ищем сотрудника с таймаутом 10 секунд
        const foundRow = await employeesPage.findEmployeeRow(employee.firstName, employee.lastName, 10000);
        expect(foundRow).not.toBeNull();
        await expect(foundRow!).toBeVisible();
      });
    });

    test('Редактирование сотрудника @regress', async ({ adminContext }) => {
  const { page, apiClient } = adminContext;
  const employeesPage = new EmployeesPage(page);

  // Создаём сотрудника через API
  const newEmployee = {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    department: 'IT',
    position: faker.person.jobTitle(),
    status: 'Active'
  };
  const createResponse = await apiClient.createEmployee(newEmployee);
  expect(createResponse.ok()).toBeTruthy();

  // Переходим на страницу списка
  await employeesPage.goto(); // <-- теперь метод существует

  // Редактирование...
  await employeesPage.clickEditForEmployee(newEmployee.firstName, newEmployee.lastName);

      // 4. Изменяем данные
      const updatedData = {
        position: faker.person.jobTitle(),
        department: 'HR'
      };
      await employeesPage.fillEmployeeForm(updatedData);

      // 5. Сохраняем изменения
      await employeesPage.saveEmployee();

      // 6. Проверяем, что данные обновились в таблице
      await employeesPage.waitForPage();
      const updatedRow = await employeesPage.findEmployeeRow(newEmployee.firstName, newEmployee.lastName, 10000);
      expect(updatedRow).not.toBeNull();

      // Проверяем ячейку должности (индекс 5) и отдела (индекс 4)
      const positionCell = updatedRow!.locator('td').nth(5);
      const deptCell = updatedRow!.locator('td').nth(4);
      await expect(positionCell).toHaveText(updatedData.position);
      await expect(deptCell).toHaveText(updatedData.department);
    });

    test('Удаление сотрудника @regress', async ({ adminContext }) => {
      const { page, apiClient } = adminContext;
      const employeesPage = new EmployeesPage(page);

      // 1. Создаём сотрудника через API
      const newEmployee = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        department: 'IT',
        position: faker.person.jobTitle(),
        status: 'Active'
      };

      const createResponse = await apiClient.createEmployee(newEmployee);
      expect(createResponse.ok()).toBeTruthy();

      // 2. Переходим на страницу списка
      await employeesPage.goto();

      // 3. Находим сотрудника и удаляем
      await employeesPage.deleteEmployee(newEmployee.firstName, newEmployee.lastName);

      // 4. Проверяем, что сотрудник исчез из таблицы
      const deletedRow = await employeesPage.findEmployeeRow(newEmployee.firstName, newEmployee.lastName, 5000);
      expect(deletedRow).toBeNull();
    });

    test('Поиск сотрудника @smoke', async ({ adminContext }) => {
      const { page } = adminContext;
      const employeesPage = new EmployeesPage(page);
      // Предполагаем, что есть сотрудник с именем John
      await employeesPage.search('John');
      const rows = await employeesPage.getEmployeeRows();
      expect(rows.length).toBe(1); // или проверка конкретного имени
    });
  });

  test.describe('Как обычный пользователь', () => {
    test('Не должен видеть кнопки редактирования/удаления @regress', async ({ userContext }) => {
      const { page } = userContext;
      const employeesPage = new EmployeesPage(page);
      await employeesPage.waitForPage();
      
      const editButtons = page.locator('.edit-btn');
      const deleteButtons = page.locator('.delete-btn');
      
      await expect(editButtons).toHaveCount(0);
      await expect(deleteButtons).toHaveCount(0);
    });

    test('Не может добавить сотрудника @regress', async ({ userContext }) => {
      const { page } = userContext;
      const employeesPage = new EmployeesPage(page);
      await employeesPage.goToAddEmployee();
      await expect(employeesPage.saveButton).toBeHidden();
    });
  });
});