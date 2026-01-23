/**
 * Apply pagination to a query result
 * @param {Array} data - The data array to paginate
 * @param {number} limit - Number of items per page
 * @param {number} offset - Number of items to skip
 * @returns {Object} Paginated result with data and metadata
 */
const paginate = (data, limit, offset) => {
  const total = data.length;
  const start = offset;
  const end = start + limit;
  const paginatedData = data.slice(start, end);

  return {
    data: paginatedData,
    pagination: {
      total,
      limit,
      offset,
      hasNext: end < total,
      hasPrev: start > 0,
    },
  };
};

module.exports = { paginate };
