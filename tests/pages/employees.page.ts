import { Page, Locator } from '@playwright/test';
import { step } from '../utils/decorators';

export class EmployeesPage {
  readonly page: Page;
  readonly pageHeader: Locator;
  readonly searchInput: Locator;
  readonly employeeTable: Locator;
  readonly tableRows: Locator;
  readonly pagination: Locator;
  // Форма добавления
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly employeeIdInput: Locator;
  readonly departmentSelect: Locator;
  readonly positionInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly photoUploadButton: Locator;
  readonly fileInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeader = page.locator('.page-header h2');
    this.searchInput = page.locator('#searchEmployee');
    this.employeeTable = page.locator('#employeeList');
    this.tableRows = page.locator('#employeeList tr');
    this.pagination = page.locator('#pagination');

    // форма добавления (находится на странице addEmployeePage)
    this.firstNameInput = page.locator('#firstName');
    this.lastNameInput = page.locator('#lastName');
    this.emailInput = page.locator('#email');
    this.employeeIdInput = page.locator('#employeeId');
    this.departmentSelect = page.locator('#department');
    this.positionInput = page.locator('#position');
    this.saveButton = page.locator('#saveEmployeeBtn');
    this.cancelButton = page.locator('.cancel-btn');
    this.photoUploadButton = page.locator('.photo-upload-btn');
    this.fileInput = page.locator('#photoInput');
  }

  @step('Дождаться загрузки страницы сотрудников')
  async waitForPage() {
  await this.page.waitForSelector('#employeeList');
  // Дождаться, пока таблица перестанет обновляться (например, стабилизируется количество строк)
  await this.page.waitForFunction(() => {
    const rows = document.querySelectorAll('#employeeList tr');
    return rows.length > 0; // или другое условие
  }, { timeout: 5000 });
}

  @step('Ввести поисковый запрос "{0}"')
  async search(text: string) {
    await this.searchInput.fill(text);
    await this.searchInput.press('Enter');
    // небольшая задержка для обновления списка
    await this.page.waitForTimeout(500);
  }

  @step('Получить список строк таблицы сотрудников')
  async getEmployeeRows(): Promise<Locator[]> {
    return await this.tableRows.all();
  }

  @step('Получить данные всех сотрудников из таблицы')
  async getEmployeesData(): Promise<Array<{
    photo?: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    department: string;
    position: string;
    status: string;
  }>> {
    const rows = await this.tableRows.all();
    const employees = [];
    for (const row of rows) {
      const cells = row.locator('td');
      employees.push({
        photo: await cells.nth(0).locator('img').getAttribute('src') || undefined,
        employeeId: (await cells.nth(1).textContent()) || '',
        firstName: (await cells.nth(2).textContent()) || '',
        lastName: (await cells.nth(3).textContent()) || '',
        department: (await cells.nth(4).textContent()) || '',
        position: (await cells.nth(5).textContent()) || '',
        status: (await cells.nth(6).textContent()) || '',
      });
    }
    return employees;
  }

  @step('Найти строку сотрудника по имени {0} и фамилии {1}')
  async findEmployeeRow(firstName: string, lastName: string, timeout = 5000): Promise<Locator | null> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const rows = await this.tableRows.all();
      for (const row of rows) {
        const firstNameCell = row.locator('td').nth(2);
        const lastNameCell = row.locator('td').nth(3);
        const fName = await firstNameCell.textContent();
        const lName = await lastNameCell.textContent();
        if (fName?.trim() === firstName && lName?.trim() === lastName) {
          return row;
        }
      }
      await this.page.waitForTimeout(300); // небольшая пауза перед следующей попыткой
    }
    return null;
  }

  @step('Перейти на страницу добавления сотрудника')
  async goToAddEmployee() {
    await this.page.locator('.sidebar li:has-text("Add Employee")').click();
    await this.page.waitForSelector('#addEmployeePage.active');
  }

  @step('Заполнить форму добавления сотрудника')
  async fillEmployeeForm(employee: {
    firstName?: string;
    lastName?: string;
    email?: string;
    employeeId?: string;
    department?: string;
    position?: string;
  }) {
    if (employee.firstName) await this.firstNameInput.fill(employee.firstName);
    if (employee.lastName) await this.lastNameInput.fill(employee.lastName);
    if (employee.email) await this.emailInput.fill(employee.email);
    if (employee.employeeId) await this.employeeIdInput.fill(employee.employeeId);
    if (employee.department) await this.departmentSelect.selectOption(employee.department);
    if (employee.position) await this.positionInput.fill(employee.position);
  }

  @step('Сохранить сотрудника')
  async saveEmployee() {
  await this.saveButton.click();
  // Ждём, что мы попали на страницу списка (или что кнопка сохранения исчезла)
  await this.page.waitForSelector('#employeeList', { timeout: 5000 });
}

  @step('Нажать кнопку редактирования для сотрудника {0} {1}')
async clickEditForEmployee(firstName: string, lastName: string) {
  const row = await this.findEmployeeRow(firstName, lastName);
  if (!row) throw new Error(`Сотрудник ${firstName} ${lastName} не найден`);
  await row.locator('.edit-btn').click();
  await this.page.waitForSelector('#addEmployeePage.active');
}

@step('Удалить сотрудника {0} {1}')
async deleteEmployee(firstName: string, lastName: string) {
  const row = await this.findEmployeeRow(firstName, lastName);
  if (!row) throw new Error(`Сотрудник ${firstName} ${lastName} не найден`);
  this.page.once('dialog', dialog => dialog.accept());
  await row.locator('.delete-btn').click();
  // Ждать исчезновения строки или тоста можно в тесте
}

  @step('Получить статус сотрудника {0} {1}')
  async getEmployeeStatus(firstName: string, lastName: string): Promise<string> {
    const row = await this.findEmployeeRow(firstName, lastName);
    if (!row) throw new Error(`Сотрудник ${firstName} ${lastName} не найден`);
    return (await row.locator('td').nth(6).textContent()) || '';
  }
  @step('Перейти на страницу списка сотрудников')
async goto() {
  await this.page.locator('.sidebar li:has-text("Employee List")').click();
  await this.waitForPage();
}
  
}