import { APIRequestContext, request, APIResponse } from '@playwright/test';

// Допустимые HTTP-методы, поддерживаемые Playwright
type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head';

export class ApiClient {
  private baseURL: string;
  private token: string = '';
  private requestContext: APIRequestContext | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async init() {
    this.requestContext = await request.newContext({ baseURL: this.baseURL });
  }

  async login(username: string, password: string) {
    if (!this.requestContext) {
      await this.init();
      if (!this.requestContext) {
        throw new Error('Не удалось инициализировать контекст запроса');
      }
    }
    const response = await this.requestContext.post('/api/login', {
      data: { username, password }
    });
    const data = await response.json();
    if (data.token) {
      this.token = data.token;
    }
    return data;
  }

  private async request(method: HttpMethod, path: string, options: any = {}) {
  if (!this.requestContext) {
    await this.init();
    if (!this.requestContext) {
      throw new Error('Не удалось инициализировать контекст запроса');
    }
  }

  const headers = {
    'Authorization': `Bearer ${this.token}`,
    ...options.headers,
  };

  const requestOptions = { ...options, headers };

  let response: APIResponse;
  switch (method) {
    case 'get':
      response = await this.requestContext.get(path, requestOptions);
      break;
    case 'post':
      response = await this.requestContext.post(path, requestOptions);
      break;
    case 'put':
      response = await this.requestContext.put(path, requestOptions);
      break;
    case 'delete':
      response = await this.requestContext.delete(path, requestOptions);
      break;
    case 'patch':
      response = await this.requestContext.patch(path, requestOptions);
      break;
    case 'head':
      response = await this.requestContext.head(path, requestOptions);
      break;
    default:
      // Это никогда не произойдёт, если method принадлежит HttpMethod
      throw new Error(`Неподдерживаемый метод: ${method}`);
  }
  return response;
}

  async get(path: string) {
    return this.request('get', path);
  }

  async post(path: string, data?: any, multipart?: boolean) {
    const options: any = {};
    if (multipart) {
      options.multipart = data;
    } else if (data) {
      options.data = data;
    }
    return this.request('post', path, options);
  }

  async put(path: string, data?: any, multipart?: boolean) {
    const options: any = {};
    if (multipart) {
      options.multipart = data;
    } else if (data) {
      options.data = data;
    }
    return this.request('put', path, options);
  }

  async delete(path: string) {
    return this.request('delete', path);
  }

  // Специфические методы
  async createEmployee(employeeData: any, photoPath?: string) {
    const multipartData: Record<string, string | Buffer> = {};
    for (const [key, value] of Object.entries(employeeData)) {
      if (value !== undefined && value !== null) {
        multipartData[key] = String(value);
      }
    }
    if (photoPath) {
      const fs = require('fs');
      multipartData.photo = fs.readFileSync(photoPath);
    }
    return this.post('/api/employees', multipartData, true);
  }

  async getEmployees(page = 1, limit = 5, search = '') {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    return this.get(`/api/employees?${params}`);
  }

  async deleteEmployee(id: string) {
    return this.delete(`/api/employees/${id}`);
  }

  async uploadDocument(name: string, category: string, filePath: string) {
    const fs = require('fs');
    const multipartData = {
      name,
      category,
      document: fs.readFileSync(filePath),
    };
    return this.post('/api/documents', multipartData, true);
  }

  async getDocuments() {
    return this.get('/api/documents');
  }

  async deleteDocument(id: string) {
    return this.delete(`/api/documents/${id}`);
  }

  async downloadDocument(id: string) {
    return this.get(`/api/documents/${id}/download`);
  }

  async generateReport(reportType: string, reportFormat: string) {
    return this.post('/api/reports/generate', { reportType, reportFormat });
  }

  async getSettings() {
    return this.get('/api/settings');
  }

  async updateSettings(settings: any) {
    return this.put('/api/settings', settings);
  }
}