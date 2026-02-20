git pull

cd backend
bun i
sleep 1
bun run build
sleep 1
cd ..

cd frontend
bun i
bun run build
sleep 1
cd ..

pm2 startOrReload ecosystem.config.js