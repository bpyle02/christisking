#!/bin/bash

# Navigate to the server directory and start the server
cd ./server
nohup npm start > server.log 2>&1 &

# Navigate back to the root and then to the frontend directory
cd ../frontend
nohup npm run dev > frontend.log 2>&1 &
