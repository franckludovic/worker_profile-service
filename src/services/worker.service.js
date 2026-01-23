const prismaClient = require('../database/prismaClient');
const { paginate } = require('../utils/pagination');
const { calculateDistance } = require('../utils/geo');

class WorkerService {
  async listWorkerProfiles(filters, pagination) {
    const { categories, active } = filters;
    const { limit, offset } = pagination;

    const where = {};
    if (categories && categories.length > 0) {
      where.categories = { hasSome: categories };
    }
    if (active !== undefined) {
      where.active = active;
    }

    const [workers, total] = await Promise.all([
      prismaClient.workerProfile.findMany({
        where,
        skip: offset,
        take: limit,
      }),
      prismaClient.workerProfile.count({ where }),
    ]);

    return { workers, total };
  }

  async createWorkerProfile(userId, profileData) {
    const profile = await prismaClient.workerProfile.create({
      data: {
        userId,
        ...profileData,
      },
    });
    return profile;
  }

  async getWorkerProfile(workerId) {
    const profile = await prismaClient.workerProfile.findUnique({
      where: { workerId },
    });
    if (!profile) {
      const error = new Error('Worker profile not found');
      error.name = 'NotFoundError';
      throw error;
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
      where: { workerId },
      data: updateData,
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

    await prismaClient.workerProfile.delete({
      where: { workerId },
    });
  }
}

module.exports = new WorkerService();
