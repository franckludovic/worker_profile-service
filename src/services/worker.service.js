const prismaClient = require('../database/prismaClient');
const { paginate } = require('../utils/pagination');
const { calculateDistance } = require('../utils/geo');

class WorkerService {
  async listWorkerProfiles(filters, pagination) {
    const { categories, active } = filters;
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

    const [workers, total] = await Promise.all([
      prismaClient.workerProfile.findMany({
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
        skip: offset,
        take: limit,
      }),
      prismaClient.workerProfile.count({ where }),
    ]);

    return { workers, total };
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

    return profile;
  }

  async getWorkerProfile(workerId) {
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
      where: { id: workerId },
    });
  }
}

module.exports = new WorkerService();
