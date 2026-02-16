import Canteen from "./canteen.model.js";
import AppError from "../../utils/AppError.js";

/**
 * Create a new canteen
 * @param {Object} canteenData - Canteen data
 * @returns {Promise<Object>} Created canteen
 */
export const createCanteen = async (canteenData) => {
  const canteen = await Canteen.create(canteenData);
  return canteen;
};

/**
 * Get all canteens
 * @param {Object} query - Query parameters for filtering
 * @returns {Promise<Array>} Array of canteens
 */
export const getAllCanteens = async (query = {}) => {
  const filter = {};
  if (query.status) {
    filter.status = query.status;
  }
  if (query.location) {
    filter.location = query.location;
  }
  const canteens = await Canteen.find(filter).sort({ createdAt: -1 });
  return canteens;
};

/**
 * Get canteen by ID
 * @param {string} id - Canteen ID
 * @returns {Promise<Object>} Canteen object
 */
export const getCanteenById = async (id) => {
  const canteen = await Canteen.findById(id);
  if (!canteen) {
    throw new AppError("Canteen not found", 404);
  }
  return canteen;
};

/**
 * Update canteen
 * @param {string} id - Canteen ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated canteen
 */
export const updateCanteen = async (id, updateData) => {
  const canteen = await Canteen.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!canteen) {
    throw new AppError("Canteen not found", 404);
  }

  return canteen;
};

/**
 * Delete canteen
 * @param {string} id - Canteen ID
 */
export const deleteCanteen = async (id) => {
  const canteen = await Canteen.findByIdAndDelete(id);
  if (!canteen) {
    throw new AppError("Canteen not found", 404);
  }
};

