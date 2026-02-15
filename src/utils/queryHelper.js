/**
 * Query Helper Utility
 * Provides reusable pagination, filtering, sorting, and field selection
 * for MongoDB/Mongoose queries
 */

/**
 * Build query options from request query parameters
 * @param {Object} queryParams - req.query object
 * @param {Object} options - Additional options
 * @returns {Object} Parsed query options
 */

export const buildQueryOptions = (queryParams, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    fields,
    search,
    // searchFields removed from queryParams
    ...filters
  } = queryParams;

  const {
    maxLimit = 100,
    defaultSort = '-createdAt',
    allowedFilters = [],
    allowedSortFields = [],
    searchFields = [], // searchFields only from options
  } = options;

  // Parse pagination
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(
    Math.max(1, parseInt(limit, 10) || 10),
    maxLimit
  );
  const skip = (parsedPage - 1) * parsedLimit;

  // Parse sort
  let sortObj = {};
  const sortFields = sort.split(',');
  sortFields.forEach((field) => {
    const isDescending = field.startsWith('-');
    const fieldName = isDescending ? field.slice(1) : field;

    // Only allow sorting on specified fields if provided
    if (
      allowedSortFields.length === 0 ||
      allowedSortFields.includes(fieldName)
    ) {
      sortObj[fieldName] = isDescending ? -1 : 1;
    }
  });

  // If no valid sort fields, use default
  if (Object.keys(sortObj).length === 0) {
    const isDescending = defaultSort.startsWith('-');
    const fieldName = isDescending ? defaultSort.slice(1) : defaultSort;
    sortObj[fieldName] = isDescending ? -1 : 1;
  }

  // Parse field selection
  let selectFields = null;
  if (fields) {
    selectFields = fields.split(',').join(' ');
  }

  // Build filter object
  const filterObj = {};

  // Process allowed filters
  Object.keys(filters).forEach((key) => {
    // Skip if not in allowed filters (when specified)
    if (allowedFilters.length > 0 && !allowedFilters.includes(key)) {
      return;
    }

    const value = filters[key];

    // Handle special filter operators
    if (typeof value === 'string') {
      // Range filters: field[gte]=value, field[lte]=value
      const rangeMatch = key.match(/^(\w+)\[(gte|gt|lte|lt|ne)\]$/);
      if (rangeMatch) {
        const [, fieldName, operator] = rangeMatch;
        if (!filterObj[fieldName]) filterObj[fieldName] = {};
        filterObj[fieldName][`$${operator}`] = isNaN(value)
          ? value
          : Number(value);
        return;
      }

      // Array filters: field[in]=value1,value2
      const arrayMatch = key.match(/^(\w+)\[(in|nin)\]$/);
      if (arrayMatch) {
        const [, fieldName, operator] = arrayMatch;
        filterObj[fieldName] = { [`$${operator}`]: value.split(',') };
        return;
      }

      // Boolean filters
      if (value === 'true' || value === 'false') {
        filterObj[key] = value === 'true';
        return;
      }

      // ObjectId filters (24 character hex string)
      if (/^[a-fA-F0-9]{24}$/.test(value)) {
        filterObj[key] = value;
        return;
      }
    }

    // Default: exact match
    filterObj[key] = value;
  });

  // Build search query
  let searchQuery = null;
  if (search && searchFields.length > 0) {
    searchQuery = {
      $or: searchFields.map((field) => ({
        [field]: { $regex: search, $options: 'i' },
      })),
    };
  }

  return {
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      skip,
    },
    sort: sortObj,
    select: selectFields,
    filter: filterObj,
    search: searchQuery,
  };
};

/**
 * Apply query options to a Mongoose query
 * @param {Object} Model - Mongoose model
 * @param {Object} queryOptions - Options from buildQueryOptions
 * @param {Object} baseFilter - Base filter to always apply
 * @returns {Object} Query and count promise
 */
export const applyQueryOptions = (
  Model,
  queryOptions,
  baseFilter = {},
  mongooseOptions = {}
) => {
  const { pagination, sort, select, filter, search } = queryOptions;

  // Combine all filters
  const combinedFilter = {
    ...baseFilter,
    ...filter,
    ...(search || {}),
  };

  // Build query
  let query = Model.find(combinedFilter)
    .sort(sort)
    .skip(pagination.skip)
    .limit(pagination.limit);

  if (mongooseOptions && Object.keys(mongooseOptions).length > 0) {
    query = query.setOptions(mongooseOptions);
  }

  // Apply field selection
  if (select) {
    query = query.select(select);
  }

  // Get total count
  const countQuery = Model.countDocuments(combinedFilter);

  if (mongooseOptions && Object.keys(mongooseOptions).length > 0) {
    countQuery.setOptions(mongooseOptions);
  }

  return { query, countQuery };
};

/**
 * Execute paginated query and return formatted response
 * @param {Object} Model - Mongoose model
 * @param {Object} queryParams - req.query object
 * @param {Object} options - Query options
 * @returns {Object} Paginated response
 */
export const paginatedQuery = async (Model, queryParams, options = {}) => {
  const {
    baseFilter = {},
    populate = [],
    mongooseOptions = {},
    ...queryOptions
  } = options;

  const parsedOptions = buildQueryOptions(queryParams, queryOptions);
  const { query, countQuery } = applyQueryOptions(
    Model,
    parsedOptions,
    baseFilter,
    mongooseOptions
  );

  // Apply populate
  if (populate.length > 0) {
    populate.forEach((pop) => {
      query.populate(pop);
    });
  }

  // Execute queries
  const [data, total] = await Promise.all([query.exec(), countQuery.exec()]);

  const { pagination } = parsedOptions;
  const totalPages = Math.ceil(total / pagination.limit);

  return {
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPrevPage: pagination.page > 1,
    },
  };
};

/**
 * Build date range filter
 * @param {string} startDate - Start date string
 * @param {string} endDate - End date string
 * @param {string} fieldName - Date field name
 * @returns {Object} Date range filter
 */
export const buildDateRangeFilter = (
  startDate,
  endDate,
  fieldName = 'createdAt'
) => {
  const filter = {};

  if (startDate || endDate) {
    filter[fieldName] = {};
    if (startDate) {
      filter[fieldName].$gte = new Date(startDate);
    }
    if (endDate) {
      filter[fieldName].$lte = new Date(endDate);
    }
  }

  return filter;
};

/**
 * Create a standard API response for paginated data
 * @param {Object} result - Result from paginatedQuery
 * @param {string} message - Success message
 * @returns {Object} Formatted API response
 */
export const formatPaginatedResponse = (
  result,
  message = 'Lấy danh sách thành công'
) => {
  return {
    success: true,
    message,
    data: result.data,
    pagination: result.pagination,
  };
};

/**
 * Common filter presets for different entities
 */
export const filterPresets = {
  // User filters
  user: {
    allowedFilters: ['role', 'status', 'emailVerified', 'canteenId'],
    searchFields: ['fullName', 'email', 'phone'],
    allowedSortFields: ['createdAt', 'fullName', 'email', 'balance'],
  },

  // Product filters
  product: {
    allowedFilters: ['categoryId', 'canteenId', 'status', 'isPopular', 'isNew'],
    searchFields: ['name', 'description', 'slug'],
    allowedSortFields: ['createdAt', 'name', 'price', 'stockQuantity'],
  },

  // Order filters
  order: {
    allowedFilters: [
      'status',
      'canteenId',
      'userId',
      'payment.method',
      'payment.status',
    ],
    searchFields: ['orderNumber'],
    allowedSortFields: ['createdAt', 'totalAmount', 'status'],
  },

  // Ingredient filters
  ingredient: {
    allowedFilters: ['categoryId', 'canteenId'],
    searchFields: ['name'],
    allowedSortFields: ['createdAt', 'name', 'stock'],
  },

  // Feedback filters
  feedback: {
    allowedFilters: ['rating', 'status', 'productId', 'userId', 'canteenId'],
    searchFields: ['comment'],
    allowedSortFields: ['createdAt', 'rating'],
  },

  // Voucher filters
  voucher: {
    allowedFilters: ['isActive', 'discountType'],
    searchFields: ['code', 'description'],
    allowedSortFields: ['createdAt', 'code', 'value', 'startDate', 'endDate'],
  },

  // Shift filters
  shift: {
    allowedFilters: ['canteenId', 'status'],
    searchFields: ['name'],
    allowedSortFields: ['createdAt', 'name', 'startTime'],
  },

  // Notification filters
  notification: {
    allowedFilters: ['type', 'isRead', 'userId', 'canteenId'],
    searchFields: ['title', 'content'],
    allowedSortFields: ['createdAt', 'isRead'],
  },

  // Banner filters
  banner: {
    allowedFilters: ['isActive', 'canteenId'],
    searchFields: ['title'],
    allowedSortFields: ['createdAt', 'order'],
  },

  // Canteen filters
  canteen: {
    allowedFilters: ['status'],
    searchFields: ['name', 'location', 'description'],
    allowedSortFields: ['createdAt', 'name'],
  },
  // Product Catefory filters

  ProductCategory: {},
};

export default {
  buildQueryOptions,
  applyQueryOptions,
  paginatedQuery,
  buildDateRangeFilter,
  formatPaginatedResponse,
  filterPresets,
};
