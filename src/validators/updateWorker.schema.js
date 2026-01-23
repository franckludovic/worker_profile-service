const Joi = require('joi');

const updateWorkerSchema = Joi.object({
  name: Joi.string().optional(),
  bio: Joi.string().optional(),
  categories: Joi.array().items(Joi.string()).optional(),
  experienceYears: Joi.number().integer().min(0).optional(),
  certifications: Joi.array().items(Joi.string()).optional(),
  skills: Joi.array().items(Joi.string()).optional(),
  baseLocation: Joi.object({
    address: Joi.string().optional(),
    city: Joi.string().optional(),
    lat: Joi.number().optional(),
    lon: Joi.number().optional(),
  }).optional(),
  serviceAreas: Joi.array().items(Joi.object({
    city: Joi.string().required(),
    note: Joi.string().optional(),
  })).optional(),
  travelRadiusKm: Joi.number().min(0).optional(),
  active: Joi.boolean().optional(),
});

module.exports = updateWorkerSchema;
