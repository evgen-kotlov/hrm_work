import express from 'express';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Настройка загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
    cb(null, uniqueSuffix + '-' + safeName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Middleware для проверки JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is missing' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token is missing' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Хранилище данных в памяти
let employees = [];
let documents = [];
let settings = {
  companyName: 'QA Tech',
  timezone: 'UTC-5',
  language: 'en',
  dateFormat: 'mm/dd/yyyy'
};

// Демо пользователи
const users = [
  {
    id: 1,
    username: 'Admin',
    password: 'admin123',
    name: 'Admin',
    role: 'admin'
  },
  {
    id: 2,
    username: 'User',
    password: 'user123',
    name: 'User',
    role: 'user'
  }
];

// 1. Аутентификация
app.post('/api/login', (req, res) => {
  console.log('Login attempt:', req.body.username);
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Username and password are required' 
    });
  }
  
  const user = users.find(u => u.username === username);
  
  if (!user) {
    console.log('User not found:', username);
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid credentials' 
    });
  }
  
  if (user.password !== password) {
    console.log('Invalid password for user:', username);
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid credentials' 
    });
  }
  
  const token = jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role, 
      name: user.name 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  console.log('Login successful for:', username);
  
  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      username: user.username
    },
    token
  });
});

// 2. Статистика дашборда
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  console.log('Dashboard stats requested by:', req.user.username);
  
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
  const totalDepartments = departments.length;
  
  const recentActivities = [
    { message: 'System started successfully' },
    { message: `Loaded ${totalEmployees} employees` },
    { message: `Welcome to QA Tech HR System` }
  ];
  
  res.json({
    totalEmployees,
    activeEmployees,
    totalDepartments,
    pendingTasks: 3,
    recentActivities
  });
});

// 3. Управление сотрудниками
app.get('/api/employees', authenticateToken, (req, res) => {
  console.log('GET /api/employees - User:', req.user.username);
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const search = req.query.search || '';
  
  console.log('Query params:', { page, limit, search });
  
  let filteredEmployees = employees;
  
  if (search) {
    const searchLower = search.toLowerCase();
    filteredEmployees = employees.filter(emp => 
      (emp.firstName && emp.firstName.toLowerCase().includes(searchLower)) ||
      (emp.lastName && emp.lastName.toLowerCase().includes(searchLower)) ||
      (emp.email && emp.email.toLowerCase().includes(searchLower))
    );
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredEmployees.length / limit);
  
  console.log('Returning:', paginatedEmployees.length, 'employees');
  
  res.json({
    employees: paginatedEmployees,
    totalPages,
    currentPage: page
  });
});

app.get('/api/employees/:id', authenticateToken, (req, res) => {
  console.log('GET /api/employees/' + req.params.id);
  
  const employee = employees.find(e => e.id === req.params.id);
  
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  
  res.json(employee);
});

app.post('/api/employees', authenticateToken, upload.single('photo'), (req, res) => {
  console.log('POST /api/employees - User:', req.user.username);
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  console.log('Body:', req.body);
  console.log('File:', req.file);
  
  const employee = {
    id: Date.now().toString(),
    firstName: req.body.firstName || '',
    lastName: req.body.lastName || '',
    employeeId: req.body.employeeId || '',
    email: req.body.email || '',
    department: req.body.department || '',
    position: req.body.position || '',
    joinDate: req.body.joinDate || '',
    contractType: req.body.contractType || '',
    salary: req.body.salary ? parseInt(req.body.salary) : 0,
    status: req.body.status || 'Active',
    notes: req.body.notes || '',
    photo: req.file ? `/uploads/${req.file.filename}` : null,
    createdAt: new Date().toISOString()
  };
  
  employees.push(employee);
  console.log('Employee created:', employee.id);
  res.status(201).json(employee);
});

app.put('/api/employees/:id', authenticateToken, upload.single('photo'), (req, res) => {
  console.log('PUT /api/employees/' + req.params.id);
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const index = employees.findIndex(e => e.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  
  const updatedEmployee = {
    ...employees[index],
    firstName: req.body.firstName || employees[index].firstName,
    lastName: req.body.lastName || employees[index].lastName,
    employeeId: req.body.employeeId || employees[index].employeeId,
    email: req.body.email || employees[index].email,
    department: req.body.department || employees[index].department,
    position: req.body.position || employees[index].position,
    joinDate: req.body.joinDate || employees[index].joinDate,
    contractType: req.body.contractType || employees[index].contractType,
    salary: req.body.salary ? parseInt(req.body.salary) : employees[index].salary,
    status: req.body.status || employees[index].status,
    notes: req.body.notes || employees[index].notes,
    photo: req.file ? `/uploads/${req.file.filename}` : employees[index].photo,
    updatedAt: new Date().toISOString()
  };
  
  employees[index] = updatedEmployee;
  res.json(updatedEmployee);
});

app.delete('/api/employees/:id', authenticateToken, (req, res) => {
  console.log('DELETE /api/employees/' + req.params.id);
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const index = employees.findIndex(e => e.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  
  const employee = employees[index];
  if (employee.photo) {
    const photoPath = join(__dirname, employee.photo);
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }
  }
  
  employees.splice(index, 1);
  res.status(204).send();
});

// 4. Управление документами
app.get('/api/documents', authenticateToken, (req, res) => {
  res.json(documents);
});

app.post('/api/documents', authenticateToken, upload.single('document'), (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const document = {
    id: Date.now().toString(),
    name: req.body.name || req.file.originalname,
    category: req.body.category || 'Other',
    size: req.file.size,
    uploadDate: new Date().toISOString().split('T')[0],
    path: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname
  };
  
  documents.push(document);
  res.status(201).json(document);
});

app.get('/api/documents/:id/download', authenticateToken, (req, res) => {
  const document = documents.find(d => d.id === req.params.id);
  
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }
  
  const filePath = join(__dirname, document.path);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.download(filePath, document.originalName);
});

app.delete('/api/documents/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const index = documents.findIndex(d => d.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Document not found' });
  }
  
  const document = documents[index];
  const filePath = join(__dirname, document.path);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  
  documents.splice(index, 1);
  res.status(204).send();
});

// 5. Отчеты
app.post('/api/reports/generate', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const { reportType, reportFormat } = req.body;
  
  let report;
  
  switch (reportType) {
    case 'employee':
      report = {
        title: 'Employee Report',
        totalEmployees: employees.length,
        activeEmployees: employees.filter(e => e.status === 'Active').length,
        employeesOnLeave: employees.filter(e => e.status === 'On Leave').length
      };
      break;
      
    case 'department':
      const departments = {};
      employees.forEach(emp => {
        if (emp.department) {
          departments[emp.department] = (departments[emp.department] || 0) + 1;
        }
      });
      report = {
        title: 'Department Report',
        departments
      };
      break;
      
    case 'salary':
      const salaries = employees.map(e => e.salary || 0).filter(s => s > 0);
      const totalSalary = salaries.reduce((a, b) => a + b, 0);
      const averageSalary = salaries.length > 0 ? totalSalary / salaries.length : 0;
      report = {
        title: 'Salary Report',
        totalSalary,
        averageSalary,
        minSalary: salaries.length > 0 ? Math.min(...salaries) : 0,
        maxSalary: salaries.length > 0 ? Math.max(...salaries) : 0
      };
      break;
      
    default:
      return res.status(400).json({ error: 'Invalid report type' });
  }
  
  res.json({
    report,
    generatedAt: new Date().toISOString(),
    format: reportFormat
  });
});

// 6. Настройки
app.get('/api/settings', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  res.json(settings);
});

app.put('/api/settings', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  settings = { ...settings, ...req.body };
  res.json(settings);
});


// Экспорт сотрудников в CSV
app.get('/api/employees/export/csv', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    console.log('Exporting employees to CSV...');
    
    // Заголовки CSV
    const headers = [
      'ID',
      'Employee ID', 
      'First Name',
      'Last Name',
      'Email',
      'Department',
      'Position',
      'Salary',
      'Status',
      'Join Date',
      'Contract Type'
    ];
    
    // Данные
    const rows = employees.map(emp => [
      emp.id,
      emp.employeeId || '',
      emp.firstName || '',
      emp.lastName || '',
      emp.email || '',
      emp.department || '',
      emp.position || '',
      emp.salary ? `$${emp.salary}` : '',
      emp.status || '',
      emp.joinDate || '',
      emp.contractType || ''
    ]);
    
    // Формируем CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Экранируем кавычки и переносы строк
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');
    
    // Отправляем файл
    res.header('Content-Type', 'text/csv');
    res.attachment('employees-export.csv');
    res.send(csvContent);
  });
  
  // Генерация отчетов с возможностью скачивания
  app.post('/api/reports/generate', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { reportType, reportFormat } = req.body;
    
    let report;
    let fileName = `report-${Date.now()}`;
    
    switch (reportType) {
      case 'employee':
        report = {
          title: 'Employee Report',
          totalEmployees: employees.length,
          activeEmployees: employees.filter(e => e.status === 'Active').length,
          employeesOnLeave: employees.filter(e => e.status === 'On Leave').length,
          data: employees.map(emp => ({
            id: emp.id,
            employeeId: emp.employeeId,
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: emp.email,
            department: emp.department,
            position: emp.position,
            salary: emp.salary,
            status: emp.status,
            joinDate: emp.joinDate,
            contractType: emp.contractType
          }))
        };
        fileName = `employee-report-${Date.now()}`;
        break;
        
      case 'department':
        const departments = {};
        employees.forEach(emp => {
          if (emp.department) {
            departments[emp.department] = (departments[emp.department] || 0) + 1;
          }
        });
        report = {
          title: 'Department Summary Report',
          departments,
          data: Object.entries(departments).map(([dept, count]) => ({
            department: dept,
            employeeCount: count,
            percentage: ((count / employees.length) * 100).toFixed(2) + '%'
          }))
        };
        fileName = `department-report-${Date.now()}`;
        break;
        
      case 'salary':
        const salaries = employees.map(e => e.salary || 0).filter(s => s > 0);
        const totalSalary = salaries.reduce((a, b) => a + b, 0);
        const averageSalary = salaries.length > 0 ? totalSalary / salaries.length : 0;
        
        report = {
          title: 'Salary Report',
          totalSalary,
          averageSalary: Math.round(averageSalary),
          minSalary: salaries.length > 0 ? Math.min(...salaries) : 0,
          maxSalary: salaries.length > 0 ? Math.max(...salaries) : 0,
          data: employees
            .filter(e => e.salary > 0)
            .map(emp => ({
              employee: `${emp.firstName} ${emp.lastName}`,
              department: emp.department,
              position: emp.position,
              salary: emp.salary
            }))
            .sort((a, b) => b.salary - a.salary)
        };
        fileName = `salary-report-${Date.now()}`;
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }
    
    // Если запрошен CSV формат, возвращаем файл
    if (reportFormat === 'csv') {
      let csvContent = '';
      
      switch (reportType) {
        case 'employee':
          // Заголовки для CSV
          const empHeaders = ['Employee ID', 'First Name', 'Last Name', 'Email', 'Department', 'Position', 'Salary', 'Status'];
          const empRows = employees.map(emp => [
            emp.employeeId || '',
            emp.firstName || '',
            emp.lastName || '',
            emp.email || '',
            emp.department || '',
            emp.position || '',
            emp.salary ? `$${emp.salary}` : '',
            emp.status || ''
          ]);
          
          csvContent = [
            empHeaders.join(','),
            ...empRows.map(row => row.map(cell => {
              const cellStr = String(cell || '');
              if (cellStr.includes(',') || cellStr.includes('"')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
              }
              return cellStr;
            }).join(','))
          ].join('\n');
          break;
          
        case 'department':
          const deptHeaders = ['Department', 'Employee Count', 'Percentage'];
          const deptRows = Object.entries(report.departments).map(([dept, count]) => [
            dept,
            count,
            ((count / employees.length) * 100).toFixed(2) + '%'
          ]);
          
          csvContent = [
            deptHeaders.join(','),
            ...deptRows.map(row => row.map(cell => {
              const cellStr = String(cell || '');
              if (cellStr.includes(',') || cellStr.includes('"')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
              }
              return cellStr;
            }).join(','))
          ].join('\n');
          break;
          
        case 'salary':
          const salaryHeaders = ['Employee', 'Department', 'Position', 'Salary'];
          const salaryRows = employees
            .filter(e => e.salary > 0)
            .map(emp => [
              `${emp.firstName} ${emp.lastName}`,
              emp.department || '',
              emp.position || '',
              `$${emp.salary}`
            ]);
          
          csvContent = [
            salaryHeaders.join(','),
            ...salaryRows.map(row => row.map(cell => {
              const cellStr = String(cell || '');
              if (cellStr.includes(',') || cellStr.includes('"')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
              }
              return cellStr;
            }).join(','))
          ].join('\n');
          break;
      }
      
      // Отправляем CSV файл
      res.header('Content-Type', 'text/csv');
      res.attachment(`${fileName}.csv`);
      return res.send(csvContent);
    }
    
    // Если запрошен PDF или Excel (демо - просто JSON)
    res.json({
      report,
      generatedAt: new Date().toISOString(),
      format: reportFormat,
      downloadUrl: `/api/reports/download/${fileName}.${reportFormat}`
    });
  });
  
  // Маршрут для скачивания отчетов (демо)
  app.get('/api/reports/download/:filename', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { filename } = req.params;
    
    // В реальном приложении здесь была бы генерация PDF/Excel
    // Сейчас просто возвращаем JSON с информацией о файле
    res.json({
      message: 'In a real application, this would download the file',
      filename: filename,
      format: filename.split('.').pop(),
      size: '256 KB',
      downloadReady: true
    });
  });
// 7. Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    employees: employees.length,
    documents: documents.length
  });
});

// 8. Статические файлы - отдаем HTML
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// Инициализация тестовых данных
function initializeTestData() {
  console.log('Initializing test data...');
  
  if (employees.length === 0) {
    employees = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        employeeId: 'EMP001',
        email: 'john.doe@qatech.com',
        department: 'IT',
        position: 'Senior Developer',
        joinDate: '2023-01-15',
        contractType: 'Full-time',
        salary: 85000,
        status: 'Active',
        notes: 'Excellent employee',
        photo: null,
        createdAt: '2023-01-15T10:00:00Z'
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        employeeId: 'EMP002',
        email: 'jane.smith@qatech.com',
        department: 'HR',
        position: 'HR Manager',
        joinDate: '2022-11-10',
        contractType: 'Full-time',
        salary: 75000,
        status: 'Active',
        notes: '',
        photo: null,
        createdAt: '2022-11-10T09:30:00Z'
      }
    ];
    
    console.log('Added', employees.length, 'test employees');
  }
  
  if (documents.length === 0) {
    documents = [
      {
        id: '1',
        name: 'Employee Handbook',
        category: 'HR',
        size: 1024000,
        uploadDate: '2024-01-15',
        path: '/uploads/sample.pdf',
        originalName: 'handbook.pdf'
      }
    ];
    
    console.log('Added', documents.length, 'test documents');
  }
}

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  initializeTestData();
  console.log(`
  🚀 HR System Backend запущен!
  
  📍 Порт: ${PORT}
  🌐 URL: http://localhost:${PORT}
  
  🔑 Демо пользователи:
     - Админ:    Admin / admin123
     - Пользователь: User / user123
  
  📊 Health check: http://localhost:${PORT}/api/health
  📁 Загрузки:     http://localhost:${PORT}/uploads/
  
  ✅ Готов к работе!
  `);
});