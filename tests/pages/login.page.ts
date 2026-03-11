import { Page, Locator } from '@playwright/test';
import { step } from '../utils/decorators';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('.login-btn');
    this.errorMessage = page.locator('#errorMessage');
  }

  async goto() {
    await this.page.goto('http://77.222.42.248:3002');
  }

  @step('Ввести логин {0} и пароль {1}')
  async fillCredentials(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  @step('Нажать кнопку входа')
  async clickLogin() {
    await this.loginButton.click();
  }

  @step('Выполнить вход с логином {0} и паролем {1}')
  async login(username: string, password: string) {
    await this.fillCredentials(username, password);
    await this.clickLogin();
  }
}