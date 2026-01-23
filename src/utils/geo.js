const { getDistance } = require('geolib');

/**
 * Calculate distance between two points
 * @param {Object} point1 - { lat, lon }
 * @param {Object} point2 - { lat, lon }
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (point1, point2) => {
  return getDistance(point1, point2) / 1000; // Convert meters to km
};

/**
 * Check if a point is within a radius of another point
 * @param {Object} center - { lat, lon }
 * @param {Object} point - { lat, lon }
 * @param {number} radiusKm - Radius in kilometers
 * @returns {boolean} True if point is within radius
 */
const isWithinRadius = (center, point, radiusKm) => {
  const distance = calculateDistance(center, point);
  return distance <= radiusKm;
};

module.exports = { calculateDistance, isWithinRadius };
