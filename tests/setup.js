// Jest setup file for worker_profile-service
const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    workerProfile: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      upsert: jest.fn(),
    },
    workerCategory: {
      createMany: jest.fn(),
    },
    skill: {
      upsert: jest.fn(),
    },
    workerSkill: {
      createMany: jest.fn(),
    },
    certification: {
      upsert: jest.fn(),
    },
    workerCertification: {
      createMany: jest.fn(),
    },
    baseLocation: {
      create: jest.fn(),
    },
    serviceArea: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  })),
}));

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    expire: jest.fn(),
    quit: jest.fn(),
  }));
});

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Global test setup
beforeAll(async () => {
  // Any global setup can go here
});

afterAll(async () => {
  // Any global cleanup can go here
});

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
