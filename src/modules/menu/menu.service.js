import Menu from "./menu.model.js";
import MenuSchedule from "./menuSchedule.model.js";
import AppError from "../../utils/AppError.js";

/**
 * Create a new menu
 * @param {Object} menuData - Menu data
 * @returns {Promise<Object>} Created menu
 */
export const createMenu = async (menuData) => {
  const menu = await Menu.create(menuData);
  return menu;
};

/**
 * Get all menus
 * @param {Object} query - Query parameters
 * @returns {Promise<Array>} Array of menus
 */
export const getAllMenus = async (query = {}) => {
  const filter = {};

  if (query.canteenId) {
    filter.canteenId = query.canteenId;
  }
  if (query.status) {
    filter.status = query.status;
  }
  if (query.date) {
    filter.date = new Date(query.date);
  }

  const menus = await Menu.find(filter)
    .populate("canteenId", "name location")
    .populate("items.productId", "name price image")
    .sort({ date: -1 });

  return menus;
};

/**
 * Get menu by ID
 * @param {string} id - Menu ID
 * @returns {Promise<Object>} Menu object
 */
export const getMenuById = async (id) => {
  const menu = await Menu.findById(id)
    .populate("canteenId", "name location")
    .populate("items.productId", "name price image description");

  if (!menu) {
    throw new AppError("Menu not found", 404);
  }
  return menu;
};

/**
 * Get active menu by canteen and date
 * @param {string} canteenId - Canteen ID
 * @param {Date} date - Date
 * @returns {Promise<Object>} Menu object
 */
export const getActiveMenuByCanteen = async (canteenId, date = new Date()) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const menu = await Menu.findOne({
    canteenId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: "active",
  }).populate("items.productId", "name price image description");

  return menu;
};

/**
 * Update menu
 * @param {string} id - Menu ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated menu
 */
export const updateMenu = async (id, updateData) => {
  const menu = await Menu.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!menu) {
    throw new AppError("Menu not found", 404);
  }

  return menu;
};

/**
 * Delete menu
 * @param {string} id - Menu ID
 */
export const deleteMenu = async (id) => {
  const menu = await Menu.findByIdAndDelete(id);
  if (!menu) {
    throw new AppError("Menu not found", 404);
  }

  // Also delete associated schedules
  await MenuSchedule.deleteMany({ menuId: id });
};

/**
 * Add item to menu
 * @param {string} menuId - Menu ID
 * @param {Object} item - Menu item data
 * @returns {Promise<Object>} Updated menu
 */
export const addMenuItem = async (menuId, item) => {
  const menu = await Menu.findByIdAndUpdate(
    menuId,
    { $push: { items: item } },
    { new: true, runValidators: true },
  ).populate("items.productId", "name price image");

  if (!menu) {
    throw new AppError("Menu not found", 404);
  }

  return menu;
};

/**
 * Remove item from menu
 * @param {string} menuId - Menu ID
 * @param {string} productId - Product ID to remove
 * @returns {Promise<Object>} Updated menu
 */
export const removeMenuItem = async (menuId, productId) => {
  const menu = await Menu.findByIdAndUpdate(
    menuId,
    { $pull: { items: { productId } } },
    { new: true },
  ).populate("items.productId", "name price image");

  if (!menu) {
    throw new AppError("Menu not found", 404);
  }

  return menu;
};

// ============ Menu Schedule Services ============

/**
 * Create menu schedule
 * @param {Object} scheduleData - Schedule data
 * @returns {Promise<Object>} Created schedule
 */
export const createMenuSchedule = async (scheduleData) => {
  const schedule = await MenuSchedule.create(scheduleData);
  return schedule;
};

/**
 * Get all menu schedules
 * @param {Object} query - Query parameters
 * @returns {Promise<Array>} Array of schedules
 */
export const getAllMenuSchedules = async (query = {}) => {
  const filter = {};

  if (query.canteenId) {
    filter.canteenId = query.canteenId;
  }
  if (query.menuId) {
    filter.menuId = query.menuId;
  }
  if (query.status) {
    filter.status = query.status;
  }

  const schedules = await MenuSchedule.find(filter)
    .populate("menuId")
    .populate("canteenId", "name")
    .sort({ startDate: -1 });

  return schedules;
};

/**
 * Get menu schedule by ID
 * @param {string} id - Schedule ID
 * @returns {Promise<Object>} Schedule object
 */
export const getMenuScheduleById = async (id) => {
  const schedule = await MenuSchedule.findById(id)
    .populate("menuId")
    .populate("canteenId", "name location");

  if (!schedule) {
    throw new AppError("Menu schedule not found", 404);
  }
  return schedule;
};

/**
 * Update menu schedule
 * @param {string} id - Schedule ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated schedule
 */
export const updateMenuSchedule = async (id, updateData) => {
  const schedule = await MenuSchedule.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!schedule) {
    throw new AppError("Menu schedule not found", 404);
  }

  return schedule;
};

/**
 * Delete menu schedule
 * @param {string} id - Schedule ID
 */
export const deleteMenuSchedule = async (id) => {
  const schedule = await MenuSchedule.findByIdAndDelete(id);
  if (!schedule) {
    throw new AppError("Menu schedule not found", 404);
  }
};
