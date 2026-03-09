// // Можно запустить сервер, если он ещё не запущен
// import { spawn } from 'child_process';
// import waitOn from 'wait-on';

// export default async function globalSetup() {
//   console.log('Проверка доступности бэкенда...');
//   try {
//     await waitOn({ resources: ['http://localhost:3001/api/health'], timeout: 30000 });
//     console.log('Бэкенд доступен.');
//   } catch (err) {
//     console.log('Бэкенд не найден, запускаем...');
//     const server = spawn('npm', ['run', 'server'], {
//       cwd: process.cwd(),
//       stdio: 'inherit',
//       shell: true
//     });
//     await waitOn({ resources: ['http://localhost:3001/api/health'], timeout: 30000 });
//     console.log('Бэкенд запущен.');
//   }
// }