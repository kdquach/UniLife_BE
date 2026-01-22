/**
 * Example Usage of Query Helper
 *
 * This file demonstrates how to use the queryHelper utility
 * for pagination, filtering, sorting, and searching in controllers.
 */

import {
  paginatedQuery,
  buildDateRangeFilter,
  formatPaginatedResponse,
  filterPresets,
} from "../utils/queryHelper.js";

/**
 * Example 1: Basic Paginated Query
 * GET /api/products?page=1&limit=10&sort=-createdAt
 */
export const getProducts = async (req, res) => {
  try {
    const result = await paginatedQuery(Product, req.query, {
      ...filterPresets.product,
      populate: [
        { path: "categoryId", select: "name" },
        { path: "canteenId", select: "name" },
      ],
    });

    res
      .status(200)
      .json(
        formatPaginatedResponse(result, "Lấy danh sách sản phẩm thành công"),
      );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Example 2: Query with Base Filter (e.g., only active products for a canteen)
 * GET /api/canteens/:canteenId/products?status=available&page=1
 */
export const getCanteenProducts = async (req, res) => {
  try {
    const { canteenId } = req.params;

    const result = await paginatedQuery(Product, req.query, {
      ...filterPresets.product,
      baseFilter: {
        canteenId,
        status: "available",
      },
    });

    res.status(200).json(formatPaginatedResponse(result));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Example 3: Query with Search
 * GET /api/users?search=nguyen&page=1&limit=20
 */
export const getUsers = async (req, res) => {
  try {
    const result = await paginatedQuery(User, req.query, {
      ...filterPresets.user,
      maxLimit: 50,
    });

    res
      .status(200)
      .json(
        formatPaginatedResponse(result, "Lấy danh sách người dùng thành công"),
      );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Example 4: Query with Date Range Filter
 * GET /api/orders?startDate=2026-01-01&endDate=2026-01-31&status=completed
 */
export const getOrders = async (req, res) => {
  try {
    const { startDate, endDate, ...otherQuery } = req.query;
    const dateFilter = buildDateRangeFilter(startDate, endDate, "createdAt");

    const result = await paginatedQuery(Order, otherQuery, {
      ...filterPresets.order,
      baseFilter: dateFilter,
      populate: [
        { path: "userId", select: "fullName email" },
        { path: "canteenId", select: "name" },
      ],
    });

    res
      .status(200)
      .json(
        formatPaginatedResponse(result, "Lấy danh sách đơn hàng thành công"),
      );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Example 5: Query with Range Filters
 * GET /api/products?price[gte]=20000&price[lte]=50000&rating[gte]=4
 */
export const getProductsByPriceRange = async (req, res) => {
  try {
    const result = await paginatedQuery(Product, req.query, {
      allowedFilters: ["categoryId", "canteenId", "status", "price", "rating"],
      searchFields: ["name", "description"],
      allowedSortFields: ["price", "createdAt", "name"],
    });

    res.status(200).json(formatPaginatedResponse(result));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Example 6: Query with Field Selection
 * GET /api/products?fields=name,price,image&page=1&limit=20
 */
export const getProductsMinimal = async (req, res) => {
  try {
    const result = await paginatedQuery(Product, req.query, {
      ...filterPresets.product,
      baseFilter: { status: "available" },
    });

    res.status(200).json(formatPaginatedResponse(result));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Example 7: Query with Multiple Array Filters
 * GET /api/products?status[in]=available,out_of_stock&categoryId[in]=id1,id2
 */
export const getProductsByMultipleFilters = async (req, res) => {
  try {
    const result = await paginatedQuery(Product, req.query, {
      ...filterPresets.product,
    });

    res.status(200).json(formatPaginatedResponse(result));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Example 8: Custom Query for Notifications
 * GET /api/notifications?type=order&isRead=false&sort=-createdAt
 */
export const getNotifications = async (req, res) => {
  try {
    const result = await paginatedQuery(Notification, req.query, {
      ...filterPresets.notification,
      baseFilter: { userId: req.user._id },
      populate: [{ path: "canteenId", select: "name" }],
    });

    res
      .status(200)
      .json(formatPaginatedResponse(result, "Lấy thông báo thành công"));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Query Parameters Reference:
 *
 * Pagination:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10, max: 100)
 *
 * Sorting:
 *   - sort: Field to sort by (prefix with - for descending)
 *   - Example: sort=-createdAt,name (sort by createdAt desc, then name asc)
 *
 * Field Selection:
 *   - fields: Comma-separated list of fields to return
 *   - Example: fields=name,price,image
 *
 * Search:
 *   - search: Search term (searches across configured searchFields)
 *   - Example: search=chicken
 *
 * Filtering:
 *   - Exact match: field=value
 *   - Range: field[gte]=value, field[gt]=value, field[lte]=value, field[lt]=value
 *   - Not equal: field[ne]=value
 *   - In array: field[in]=value1,value2
 *   - Not in array: field[nin]=value1,value2
 *   - Boolean: field=true or field=false
 *
 * Response Format:
 * {
 *   success: true,
 *   message: "...",
 *   data: [...],
 *   pagination: {
 *     page: 1,
 *     limit: 10,
 *     total: 100,
 *     totalPages: 10,
 *     hasNextPage: true,
 *     hasPrevPage: false
 *   }
 * }
 */

export default {
  getProducts,
  getCanteenProducts,
  getUsers,
  getOrders,
  getProductsByPriceRange,
  getProductsMinimal,
  getProductsByMultipleFilters,
  getNotifications,
};
