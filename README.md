# Worker Profile Service

This is a microservice for managing worker profiles and service offerings in the Home Services Marketplace.

## Features

- **Worker Profile Management**: Create, read, update, and delete worker profiles
- **Authentication**: JWT-based authentication
- **Role-based Access Control**: Separate permissions for workers and admins
- **Ownership Validation**: Ensure users can only access their own data
- **Input Validation**: Validate incoming data
- **Geo-based Services**: Location and radius-based services
- **Pagination Support**: Handle large datasets with pagination
- **Filtering**: Filter by categories and active status

## API Documentation

See [docs/worker-profile-service.yaml](docs/worker-profile-service.yaml) for the OpenAPI specification.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env`:
   ```
   NODE_ENV=development
   PORT=3000
   DATABASE_URL=postgresql://user:password@localhost:5432/worker_profile
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-secret-key
   ```

3. Run with Docker:
   ```bash
   docker-compose up --build
   ```

4. Or run locally:
   ```bash
   npm run dev
   ```

## Project Structure

```
worker-profile-service/
├── .gitignore
├── docker-compose.yml
├── package.json
├── package-lock.json
├── server.js
├── docs/
│   └── worker-profile-service.yaml
├── src/
│   ├── app.js
│   ├── config/
│   │   ├── config.js
│   │   └── redis.js
│   ├── controllers/
│   │   └── worker.controller.js
│   ├── database/
│   │   └── prismaClient.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── ownership.middleware.js
│   │   ├── error.middleware.js
│   │   └── validate.middleware.js
│   ├── routes/
│   │   └── worker.routes.js
│   ├── services/
│   │   └── worker.service.js
│   ├── utils/
│   │   ├── geo.js
│   │   └── pagination.js
│   └── validators/
│       ├── createWorker.schema.js
│       └── updateWorker.schema.js
└── README.md
