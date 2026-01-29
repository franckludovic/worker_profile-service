const { PrismaClient } = require('@prisma/client');
const RedisCache = require('../src/utils/redisCache');
const { calculateDistance } = require('../src/utils/geo');
const { paginate } = require('../src/utils/pagination');
const workerService = require('../src/services/worker.service');

// Mock dependencies
jest.mock('../src/database/prismaClient');
jest.mock('../src/utils/redisCache');
jest.mock('../src/utils/geo');
jest.mock('../src/utils/pagination');
jest.mock('../src/services/eventPublisher.service');

const prisma = new PrismaClient();
const mockCache = new RedisCache();

describe('Worker Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Redis Caching Tests', () => {
    test('should return cached worker profile on cache hit', async () => {
      const mockWorker = { id: '1', name: 'John Doe' };
      mockCache.get.mockResolvedValue(JSON.stringify(mockWorker));

      const result = await workerService.getWorkerProfile('1');

      expect(mockCache.get).toHaveBeenCalledWith('worker:1');
      expect(result).toEqual(mockWorker);
      expect(prisma.workerProfile.findUnique).not.toHaveBeenCalled();
    });

    test('should fetch from database and cache on cache miss', async () => {
      const mockWorker = { id: '1', name: 'John Doe' };
      mockCache.get.mockResolvedValue(null);
      prisma.workerProfile.findUnique.mockResolvedValue(mockWorker);

      const result = await workerService.getWorkerProfile('1');

      expect(mockCache.get).toHaveBeenCalledWith('worker:1');
      expect(prisma.workerProfile.findUnique).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalledWith('worker:1', mockWorker, 300);
      expect(result).toEqual(mockWorker);
    });

    test('should handle cache invalidation on profile update', async () => {
      const mockWorker = { id: '1', name: 'John Doe', userId: 'user1' };
      prisma.workerProfile.findUnique.mockResolvedValue(mockWorker);
      prisma.workerProfile.update.mockResolvedValue({ ...mockWorker, name: 'Jane Doe' });

      await workerService.updateWorkerProfile('1', { name: 'Jane Doe' }, 'user1', 'worker');

      expect(mockCache.del).toHaveBeenCalledWith('worker:1');
    });

    test('should handle cache invalidation on profile deletion', async () => {
      const mockWorker = { id: '1', name: 'John Doe', userId: 'user1' };
      prisma.workerProfile.findUnique.mockResolvedValue(mockWorker);

      await workerService.deleteWorkerProfile('1', 'user1', 'worker');

      expect(mockCache.del).toHaveBeenCalledWith('worker:1');
    });

    test('should gracefully handle cache failures', async () => {
      mockCache.get.mockRejectedValue(new Error('Redis connection failed'));
      const mockWorker = { id: '1', name: 'John Doe' };
      prisma.workerProfile.findUnique.mockResolvedValue(mockWorker);

      const result = await workerService.getWorkerProfile('1');

      expect(result).toEqual(mockWorker);
    });
  });

  describe('Pagination Tests', () => {
    test('should return paginated worker profiles', async () => {
      const mockWorkers = [
        { id: '1', name: 'Worker 1' },
        { id: '2', name: 'Worker 2' }
      ];
      const mockPaginatedResult = {
        items: mockWorkers,
        total: 2,
        limit: 10,
        offset: 0
      };

      prisma.workerProfile.findMany.mockResolvedValue(mockWorkers);
      paginate.mockReturnValue(mockPaginatedResult);

      const result = await workerService.listWorkerProfiles({}, { limit: 10, offset: 0 });

      expect(paginate).toHaveBeenCalledWith(mockWorkers, 2, 10, 0);
      expect(result).toEqual(mockPaginatedResult);
    });

    test('should handle pagination with filters', async () => {
      const filters = { categories: ['plumbing'], active: true };
      const pagination = { limit: 5, offset: 10 };

      prisma.workerProfile.findMany.mockResolvedValue([]);

      await workerService.listWorkerProfiles(filters, pagination);

      expect(prisma.workerProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categories: {
              some: {
                category: { name: { in: ['plumbing'] } }
              }
            },
            active: true
          })
        })
      );
    });
  });

  describe('Distance Calculation Tests', () => {
    test('should calculate distances when user location provided', async () => {
      const userLocation = { lat: 40.7128, lng: -74.0060 }; // NYC
      const mockWorkers = [
        {
          id: '1',
          baseLocation: { latitude: 40.7589, longitude: -73.9851 } // Times Square
        },
        {
          id: '2',
          baseLocation: { latitude: 40.7505, longitude: -73.9934 } // Empire State
        }
      ];

      calculateDistance
        .mockReturnValueOnce(2.5) // Distance to Times Square
        .mockReturnValueOnce(1.8); // Distance to Empire State

      prisma.workerProfile.findMany.mockResolvedValue(mockWorkers);

      const result = await workerService.listWorkerProfiles(
        { sortByDistance: true },
        { limit: 10, offset: 0 },
        userLocation
      );

      expect(calculateDistance).toHaveBeenCalledTimes(2);
      expect(result.items[0].distance).toBe(1.8); // Closer one first
      expect(result.items[1].distance).toBe(2.5);
    });

    test('should sort by distance when requested', async () => {
      const userLocation = { lat: 40.7128, lng: -74.0060 };
      const mockWorkers = [
        {
          id: '1',
          baseLocation: { latitude: 40.7589, longitude: -73.9851 },
          distance: 2.5
        },
        {
          id: '2',
          baseLocation: { latitude: 40.7505, longitude: -73.9934 },
          distance: 1.8
        }
      ];

      calculateDistance
        .mockReturnValueOnce(2.5)
        .mockReturnValueOnce(1.8);

      prisma.workerProfile.findMany.mockResolvedValue(mockWorkers);

      const result = await workerService.listWorkerProfiles(
        { sortByDistance: true },
        { limit: 10, offset: 0 },
        userLocation
      );

      expect(result.items[0].id).toBe('2'); // Closer worker first
      expect(result.items[1].id).toBe('1');
    });

    test('should handle workers without base location', async () => {
      const userLocation = { lat: 40.7128, lng: -74.0060 };
      const mockWorkers = [
        {
          id: '1',
          baseLocation: { latitude: 40.7589, longitude: -73.9851 }
        },
        {
          id: '2',
          baseLocation: null // No location
        }
      ];

      calculateDistance.mockReturnValueOnce(2.5);
      prisma.workerProfile.findMany.mockResolvedValue(mockWorkers);

      const result = await workerService.listWorkerProfiles(
        { sortByDistance: true },
        { limit: 10, offset: 0 },
        userLocation
      );

      expect(result.items[0].distance).toBe(2.5);
      expect(result.items[1].distance).toBe(null);
    });
  });

  describe('Event Publishing Tests', () => {
    test('should publish worker created event', async () => {
      const profileData = { name: 'John Doe', categories: ['plumbing'] };
      const mockProfile = { id: '1', name: 'John Doe', userId: 'user1' };

      prisma.workerProfile.create.mockResolvedValue(mockProfile);
      prisma.category.upsert.mockResolvedValue({ id: 'cat1', name: 'plumbing' });
      prisma.workerCategory.createMany.mockResolvedValue({ count: 1 });

      await workerService.createWorkerProfile('user1', profileData);

      expect(EventPublisher.publishEvent).toHaveBeenCalledWith('worker.created', {
        workerId: '1',
        userId: 'user1',
        name: 'John Doe'
      });
    });

    test('should publish worker updated event', async () => {
      const mockWorker = { id: '1', name: 'John Doe', userId: 'user1' };
      prisma.workerProfile.findUnique.mockResolvedValue(mockWorker);
      prisma.workerProfile.update.mockResolvedValue({ ...mockWorker, name: 'Jane Doe' });

      await workerService.updateWorkerProfile('1', { name: 'Jane Doe' }, 'user1', 'worker');

      expect(EventPublisher.publishEvent).toHaveBeenCalledWith('worker.updated', {
        workerId: '1',
        userId: 'user1',
        name: 'Jane Doe'
      });
    });

    test('should publish worker deleted event', async () => {
      const mockWorker = { id: '1', name: 'John Doe', userId: 'user1' };
      prisma.workerProfile.findUnique.mockResolvedValue(mockWorker);

      await workerService.deleteWorkerProfile('1', 'user1', 'worker');

      expect(EventPublisher.publishEvent).toHaveBeenCalledWith('worker.deleted', {
        workerId: '1',
        userId: 'user1',
        name: 'John Doe'
      });
    });
  });

  describe('Error Handling Tests', () => {
    test('should throw NotFoundError for non-existent worker', async () => {
      prisma.workerProfile.findUnique.mockResolvedValue(null);

      await expect(workerService.getWorkerProfile('999')).rejects.toThrow('Worker profile not found');
    });

    test('should throw ForbiddenError for unauthorized access', async () => {
      const mockWorker = { id: '1', name: 'John Doe', userId: 'user1' };
      prisma.workerProfile.findUnique.mockResolvedValue(mockWorker);

      await expect(
        workerService.updateWorkerProfile('1', { name: 'Jane Doe' }, 'user2', 'worker')
      ).rejects.toThrow('Access denied');
    });

    test('should handle database transaction failures', async () => {
      prisma.$transaction.mockRejectedValue(new Error('Database error'));

      await expect(
        workerService.createWorkerProfile('user1', { name: 'John Doe' })
      ).rejects.toThrow('Database error');
    });
  });

  describe('Performance Tests', () => {
    test('should measure cache hit performance', async () => {
      const startTime = Date.now();
      const mockWorker = { id: '1', name: 'John Doe' };
      mockCache.get.mockResolvedValue(JSON.stringify(mockWorker));

      await workerService.getWorkerProfile('1');

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should be very fast
    });

    test('should handle concurrent requests', async () => {
      const mockWorker = { id: '1', name: 'John Doe' };
      mockCache.get.mockResolvedValue(null);
      prisma.workerProfile.findUnique.mockResolvedValue(mockWorker);

      const promises = Array(10).fill().map(() =>
        workerService.getWorkerProfile('1')
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result).toEqual(mockWorker);
      });
    });
  });
});
