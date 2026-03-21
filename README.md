docker build -t hr-system-backend .

docker run -p 3000:3000 -v $(pwd)/uploads:/app/uploads hr-system-backend


docker-compose up -d

node server.js
 test triggers github push + wh_1