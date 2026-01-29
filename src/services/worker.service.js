const prismaClient = require('../database/prismaClient');
const { paginate } = require('../utils/pagination');
const { calculateDistance } = require('../utils/geo');
const axios = require('axios');
const config = require('../config/config');
const EventPublisher = require('./eventPublisher.service');
const redisClient = require('../config/redis');
const RedisCache = require('../utils/redisCache');

const cache = new RedisCache(redisClient, 600); // 10 minutes default TTL

class WorkerService {
  async listWorkerProfiles(filters, pagination, userLocation = null) {
    const { categories, active, sortByDistance = false } = filters;
    const { limit, offset } = pagination;

    const where = {};
    if (categories && categories.length > 0) {
      where.categories = {
        some: {
          category: {
            name: { in: categories }
          }
        }
      };
    }
    if (active !== undefined) {
      where.active = active;
    }

    let workers = await prismaClient.workerProfile.findMany({
      where,
      include: {
        categories: {
          include: {
            category: true
          }
        },
        skills: {
          include: {
            skill: true
          }
        },
        certifications: {
          include: {
            certification: true
          }
        },
        serviceAreas: true,
        baseLocation: true
      },
    });

    // Calculate distances if userLocation is provided
    if (userLocation && userLocation.lat && userLocation.lng) {
      workers = workers.map(worker => {
        if (worker.baseLocation) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            worker.baseLocation.latitude,
            worker.baseLocation.longitude
          );
          return { ...worker, distance };
        }
        return { ...worker, distance: null };
      });

      // Sort by distance if requested
      if (sortByDistance) {
        workers.sort((a, b) => {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
      }
    }

    const total = workers.length;

    // Apply pagination after sorting
    const paginatedWorkers = workers.slice(offset, offset + limit);

    return paginate(paginatedWorkers, total, limit, offset);
  }

  async createWorkerProfile(userId, profileData) {
    const { categories, skills, certifications, baseLocation, serviceAreas, ...profileFields } = profileData;

  const profile = await prismaClient.$transaction(async (tx) => {
    // Create the profile
    const newProfile = await tx.workerProfile.create({
      data: {
        userId,
        ...profileFields,
      },
    });

      // Create categories
      if (categories && categories.length > 0) {
        const categoryRecords = await Promise.all(
          categories.map(name => tx.category.upsert({
            where: { name },
            update: {},
            create: { name },
          }))
        );
        await tx.workerCategory.createMany({
          data: categoryRecords.map(cat => ({ workerId: newProfile.id, categoryId: cat.id })),
        });
      }

      // Create skills
      if (skills && skills.length > 0) {
        const skillRecords = await Promise.all(
          skills.map(name => tx.skill.upsert({
            where: { name },
            update: {},
            create: { name },
          }))
        );
        await tx.workerSkill.createMany({
          data: skillRecords.map(skill => ({ workerId: newProfile.id, skillId: skill.id })),
        });
      }

      // Create certifications
      if (certifications && certifications.length > 0) {
        const certificationRecords = await Promise.all(
          certifications.map(name => tx.certification.upsert({
            where: { name },
            update: {},
            create: { name },
          }))
        );
        await tx.workerCertification.createMany({
          data: certificationRecords.map(cert => ({ workerId: newProfile.id, certificationId: cert.id })),
        });
      }

      // Create baseLocation
      if (baseLocation) {
        await tx.baseLocation.create({
          data: {
            workerId: newProfile.id,
            ...baseLocation,
          },
        });
      }

      // Create serviceAreas
      if (serviceAreas && serviceAreas.length > 0) {
        await tx.serviceArea.createMany({
          data: serviceAreas.map(area => ({ workerId: newProfile.id, ...area })),
        });
      }

      return newProfile;
    });

    // Publish worker created event
    await EventPublisher.publishEvent('worker.created', {
      workerId: profile.id,
      userId,
      name: profile.name,
    });

    return profile;
  }

  async getWorkerProfile(workerId) {
    // Generate cache key for worker profile
    const cacheKey = `worker:${workerId}`;

    // Try to get from cache first
    const cachedProfile = await cache.get(cacheKey);
    if (cachedProfile) {
      try {
        return JSON.parse(cachedProfile);
      } catch (error) {
        console.error('Error parsing cached worker profile:', error);
        // Continue to fetch from database if cache parsing fails
      }
    }

    // Cache miss - fetch from database
    const profile = await prismaClient.workerProfile.findUnique({
      where: { id: workerId },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        skills: {
          include: {
            skill: true
          }
        },
        certifications: {
          include: {
            certification: true
          }
        },
        serviceAreas: true,
        baseLocation: true
      }
    });
    if (!profile) {
      const error = new Error('Worker profile not found');
      error.name = 'NotFoundError';
      throw error;
    }

    // Cache the worker profile (TTL: 5 minutes for worker data)
    try {
      await cache.set(cacheKey, profile, 300);
    } catch (error) {
      console.error('Error caching worker profile:', error);
      // Don't fail the request if caching fails
    }

    return profile;
  }

  async updateWorkerProfile(workerId, updateData, userId, userRole) {
    const profile = await this.getWorkerProfile(workerId);

    // Check ownership if not admin
    if (userRole !== 'admin' && profile.userId !== userId) {
      const error = new Error('Access denied');
      error.name = 'ForbiddenError';
      throw error;
    }

    const updatedProfile = await prismaClient.workerProfile.update({
      where: { id: workerId },
      data: updateData,
    });

    // Invalidate worker cache
    try {
      await cache.del(`worker:${workerId}`);
    } catch (error) {
      console.error('Error clearing worker cache after update:', error);
      // Don't fail the update if cache clearing fails
    }

    // Publish worker updated event
    await EventPublisher.publishEvent('worker.updated', {
      workerId,
      userId: profile.userId,
      name: updatedProfile.name,
    });

    return updatedProfile;
  }

  async deleteWorkerProfile(workerId, userId, userRole) {
    const profile = await this.getWorkerProfile(workerId);

    // Check ownership if not admin
    if (userRole !== 'admin' && profile.userId !== userId) {
      const error = new Error('Access denied');
      error.name = 'ForbiddenError';
      throw error;
    }

    // Publish worker deleted event before deletion
    await EventPublisher.publishEvent('worker.deleted', {
      workerId,
      userId: profile.userId,
      name: profile.name,
    });

    await prismaClient.workerProfile.delete({
      where: { id: workerId },
    });
  }

  async checkWorkerService(workerId, serviceId) {
    const profile = await prismaClient.workerProfile.findUnique({
      where: { id: workerId },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });

    if (!profile) {
      const error = new Error('Worker profile not found');
      error.name = 'NotFoundError';
      throw error;
    }

    const hasService = profile.categories.some(cat => cat.category.name === serviceId);
    return { available: hasService };
  }

  async getWorkerOwner(workerId) {
    const profile = await prismaClient.workerProfile.findUnique({
      where: { id: workerId },
      select: { userId: true }
    });

    if (!profile) {
      const error = new Error('Worker profile not found');
      error.name = 'NotFoundError';
      throw error;
    }

    return { workerId, userId: profile.userId };
  }
}

module.exports = new WorkerService();
