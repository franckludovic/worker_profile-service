const express = require('express');
const router = express.Router();

const workerController = require('../controllers/worker.controller');
const auth = require('../middlewares/auth.middleware');
const { checkRole } = require('../middlewares/role.middleware');
const { checkOwnership } = require('../middlewares/ownership.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');
const createWorkerSchema = require('../validators/createWorker.schema');
const updateWorkerSchema = require('../validators/updateWorker.schema');

// List worker profiles
router.get('/workers', auth, workerController.listWorkerProfiles);

// Create worker profile
router.post('/workers', auth, validateRequest(createWorkerSchema), workerController.createWorkerProfile);

// Get worker profile
router.get('/workers/:worker_id', auth, workerController.getWorkerProfile);

// Update worker profile
router.patch(
  '/workers/:worker_id',
  auth,
  checkOwnership,
  validateRequest(updateWorkerSchema),
  workerController.updateWorkerProfile
);

// Delete worker profile
router.delete('/workers/:worker_id', auth, checkOwnership, workerController.deleteWorkerProfile);

// Check if worker offers a specific service
router.get('/workers/:worker_id/services/:service_id', auth, workerController.checkWorkerService);

// Internal endpoint for ownership verification (used by availability-service)
router.get('/internal/workers/:worker_id/owner', workerController.getWorkerOwner);

module.exports = router;
