import catchAsync from "../../utils/catchAsync.js";
import * as menuService from "./menu.service.js";

// ============ Menu Controllers ============

/**
 * Create a new menu
 * @route POST /api/menus
 * @access Private (Staff, Admin)
 */
export const createMenu = catchAsync(async (req, res) => {
  const canteenId = req.user?.canteenId
  if (!canteenId) {
    return res.status(400).json({ message: "canteenId is required" });
  }
  const menu = await menuService.createMenu({ ...req.body, canteenId });

  res.status(201).json({
    status: "success",
    data: {
      menu,
    },
  });
});

/**
 * Get all menus
 * @route GET /api/menus
 * @access Public
 */
export const getAllMenus = catchAsync(async (req, res) => {
  const result = await menuService.getAllMenus(req.query);

  res.status(200).json({
    status: "success",
    results: result.pagination.total,
    data: {
      menus: result.data,
      pagination: result.pagination,
    },
  });
});

/**
 * Get menu by ID
 * @route GET /api/menus/:id
 * @access Public
 */
export const getMenuById = catchAsync(async (req, res) => {
  const menu = await menuService.getMenuById(req.params.id);

  res.status(200).json({
    status: "success",
    data: {
      menu,
    },
  });
});



/**
 * Update menu
 * @route PATCH /api/menus/:id
 * @access Private (Staff, Admin)
 */
export const updateMenu = catchAsync(async (req, res) => {
  const menu = await menuService.updateMenu(req.params.id, req.body);

  res.status(200).json({
    status: "success",
    data: {
      menu,
    },
  });
});

/**
 * Delete menu
 * @route DELETE /api/menus/:id
 * @access Private (Admin)
 */
export const deleteMenu = catchAsync(async (req, res) => {
  await menuService.deleteMenu(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * Add item to menu
 * @route POST /api/menus/:id/items
 * @access Private (Staff, Admin)
 */
export const addMenuItem = catchAsync(async (req, res) => {
  const menu = await menuService.addMenuItem(req.params.id, req.body);

  res.status(200).json({
    status: "success",
    data: {
      menu,
    },
  });
});

/**
 * Remove item from menu
 * @route DELETE /api/menus/:id/items/:productId
 * @access Private (Staff, Admin)
 */
export const removeMenuItem = catchAsync(async (req, res) => {
  const menu = await menuService.removeMenuItem(
    req.params.id,
    req.params.productId,
  );

  res.status(200).json({
    status: "success",
    data: {
      menu,
    },
  });
});

// ============ Menu Schedule Controllers ============

/**
 * Create menu schedule
 * @route POST /api/menus/schedules
 * @access Private (Staff, Admin)
 */
export const createMenuSchedule = catchAsync(async (req, res) => {
  const schedule = await menuService.createMenuSchedule(req.body);

  res.status(201).json({
    status: "success",
    data: {
      schedule,
    },
  });
});

/**
 * Get all menu schedules
 * @route GET /api/menus/schedules
 * @access Public
 */
export const getAllMenuSchedules = catchAsync(async (req, res) => {
  const schedules = await menuService.getAllMenuSchedules(req.query);

  res.status(200).json({
    status: "success",
    results: schedules.length,
    data: {
      schedules,
    },
  });
});

/**
 * Get menu schedule by ID
 * @route GET /api/menus/schedules/:id
 * @access Public
 */
export const getMenuScheduleById = catchAsync(async (req, res) => {
  const schedule = await menuService.getMenuScheduleById(req.params.id);

  res.status(200).json({
    status: "success",
    data: {
      schedule,
    },
  });
});

/**
 * Update menu schedule
 * @route PATCH /api/menus/schedules/:id
 * @access Private (Staff, Admin)
 */
export const updateMenuSchedule = catchAsync(async (req, res) => {
  const schedule = await menuService.updateMenuSchedule(
    req.params.id,
    req.body,
  );

  res.status(200).json({
    status: "success",
    data: {
      schedule,
    },
  });
});

/**
 * @route PATCH /api/menus/schedules/:id/toggle
 * @access Private (Staff, Admin)
 */
export const toggleScheduleStatus = catchAsync(async (req, res) => {
  const updatedSchedule = await menuService.toggleScheduleStatus(
    req.params.id
  );

  res.status(200).json({
    message: "Schedule status toggled successfully",
    data: updatedSchedule,
  });
});

/**
 * @route POST /api/menus/schedules/:id/duplicate
 * @access Private (Staff, Admin)
 */
export const duplicateSchedule = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { startAt, endAt } = req.body;

  if (!startAt || !endAt) {
    return res.status(400).json({
      message: "startAt and endAt are required",
    });
  }

  const newSchedule = await menuService.duplicateSchedule(
    id,
    startAt,
    endAt
  );

  res.status(201).json({
    message: "Schedule duplicated successfully",
    data: newSchedule,
  });
});

export const getCurrentMenuByCanteen = catchAsync(async (req, res) => {
  const { canteenId } = req.params;

  const schedule =
    await menuService.getCurrentMenuByCanteen(canteenId);

  if (!schedule) {
    return res.status(404).json({
      message: "No active menu found for this canteen",
    });
  }

  res.status(200).json({
    message: "Current active menu fetched successfully",
    data: schedule,
  });
});

/**
 * Delete menu schedule
 * @route DELETE /api/menus/schedules/:id
 * @access Private (Admin)
 */
export const deleteMenuSchedule = catchAsync(async (req, res) => {
  await menuService.deleteMenuSchedule(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// /**
//  * Get active menu by canteen
//  * @route GET /api/menus/canteen/:canteenId/active
//  * @access Public
//  */
// export const getActiveMenuByCanteen = catchAsync(async (req, res) => {
//   const date = req.query.date ? new Date(req.query.date) : new Date();
//   const menu = await menuService.getActiveMenuByCanteen(
//     req.params.canteenId,
//     date,
//   );

//   res.status(200).json({
//     status: "success",
//     data: {
//       menu,
//     },
//   });
// });