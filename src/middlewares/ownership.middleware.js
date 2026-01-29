const workerService = require('../services/worker.service');

const checkOwnership = async (req, res, next) => {
  const { worker_id } = req.params;
  const userId = req.user.sub;
  const userRole = req.user.role;

  // Admins can access any profile
  if (userRole === 'admin') {
    return next();
  }

  // Workers can only access their own profile
  const profile = await workerService.getWorkerProfile(worker_id);
  if (profile.userId !== userId) {
    return res.status(403).json({ message: 'Access denied: not the owner' });
  }

  next();
};

module.exports = { checkOwnership };
