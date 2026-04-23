# README:
very simple setup of teh react, node.js, Python, MongoDB, Redis.
Simple create a task and goes to the redis queue with python worker with store on the mongodb.


## Tech Stack:
- Frontend: React with Vite
- Backend: Node.js with Express
- Worker: Python
- Database: MongoDB
- Queue: Redis
- Containerization: Docker


task-platform:
  client/        React frontend
  server/        Node.js backend
  worker/        Python worker
  infra/         docker-compose file
  .env   environment variables


Setup and Running Locally

Step 1 - Clone the repo

  git clone https://github.com/tech-dipesh/task-queue-assignemnt
  cd task-queue-assignemnt


Step 3 - Run with Docker Compose
  cd infra
  docker-compose up --build
  This will start all five services: mongo, redis, server, worker, and client.


Step 4 - Open the app

  Go to http://localhost:3000 in your browser.

  Register an account, log in, and start creating tasks.


Running Without Docker (development)

If you want to run each service separately:

  For server:
    cd server
    npm install
    npm run dev

  For client:
    cd client
    npm install
    npm run dev

  For worker:
    cd worker
    pip install -r requirements.txt
    python worker.py


  Make sure MongoDB and Redis are running locally on their default ports,


## Working:
1. User registers and logs in, gets a JWT token.
2. User creates a task with a title, input text, and an operation.
3. Server saves the task to MongoDB with status pending.
4. Server pushes the task ID to a Redis list called task_queue.
5. Python worker is running a loop with brpop, waiting on that list.
6. Worker picks up the task ID, fetches the task from MongoDB.
7. Worker sets status to running, does the operation, saves the result.
8. Frontend polls /tasks every 3 seconds and shows the updated status and result.


Supported Operations

- uppercase: converts input text to uppercase
- lowercase: converts input text to lowercase
- reverse: reverses the input text
- wordcount: counts the number of words in the input text


Environment Variables

  MONGO_URI      MongoDB connection string
  REDIS_HOST     Redis host
  REDIS_PORT     Redis port
  JWT_SECRET     Secret key used to sign JWT tokens
  PORT           Port for the backend server (default 5000)


Notes
- Passwords are stored in plain text in this version to keep it minimal.
  Add bcrypt if going to production.
- The frontend polls every 3 seconds to refresh task status.
- The worker retries the Redis connection automatically if it drops.