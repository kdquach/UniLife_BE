import Menu from "./menu.model.js";
import MenuSchedule from "./menuSchedule.model.js";
import AppError from "../../utils/AppError.js";
import { filterPresets, paginatedQuery } from "../../utils/queryHelper.js";

/**
 * Create a new menu
 * @param {Object} menuData - Menu data
 * @returns {Promise<Object>} Created menu
 */
export const createMenu = async (menuData) => {
  const menu = await Menu.create(menuData)
  return menu;
};

/**
 * Get all menus (with pagination)
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} Paginated menus result
 */
export const getAllMenus = async (query = {}) => {
  const filter = {};

  if (query.canteenId) {
    filter.canteenId = query.canteenId;
  }
  if (query.status) {
    filter.status = query.status;
  }

  // Sử dụng helper phân trang chung, áp dụng filter theo canteenId/status
  return paginatedQuery(Menu, query, {
    baseFilter: filter,
    ...filterPresets.menu,
    // Comment: Luôn populate thông tin món trong thực đơn để FE hiển thị tên, giá, danh mục
    populate: [
      {
        path: "items.productId",
        select: "name price image categoryId",
        populate: {
          path: "categoryId",
          select: "name",
        },
      },
    ],
  });
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
 * Check if a product is available in the menu for a specific date
 * @param {string} productId - Product ID
 * @param {string} canteenId - Canteen ID
 * @param {Date} date - Date to check (default: today)
 * @returns {Promise<boolean>} True if available, false otherwise
 */
export const checkMenuAvailability = async (
  productId,
  canteenId,
  date = new Date(),
) => {
  const menu = await getActiveMenuByCanteen(canteenId, date);

  if (!menu || !menu.items) {
    return false;
  }

  // Check if product exists in menu items
  // Note: items is an array of objects with structure { productId: ... }
  // When populated, productId is an object, otherwise it's an ID string
  const isAvailable = menu.items.some((item) => {
    const itemProductId = item.productId._id
      ? item.productId._id.toString()
      : item.productId.toString();
    return itemProductId === productId.toString();
  });

  return isAvailable;
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
  })
    // Comment: Populate lại danh sách món sau khi cập nhật để FE có đủ name/price/category
    .populate({
      path: "items.productId",
      select: "name price image categoryId",
      populate: {
        path: "categoryId",
        select: "name",
      },
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
  const menu = await Menu.findById(id);

  if (!menu) {
    throw new AppError("Menu not found", 404);
  }

  // Comment: Không cho phép xóa thực đơn đang hoạt động
  if (menu.status === "active") {
    throw new AppError(
      "Không thể xóa thực đơn đang hoạt động",
      400,
    );
  }

  // Comment: Xóa toàn bộ lịch áp dụng liên quan đến thực đơn này
  await MenuSchedule.deleteMany({ menuId: id });

  // Comment: Sau khi xóa lịch, xóa luôn bản thân thực đơn
  await menu.deleteOne();
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
  const { menuId, canteenId, startAt, endAt } = scheduleData;

  if (new Date(startAt) >= new Date(endAt)) {
    throw new AppError("Invalid time range", 400);
  }

  // Chỉ cho phép áp dụng lịch từ hôm nay đến tối đa 7 ngày tới
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 7);
  maxDate.setHours(23, 59, 59, 999);

  const start = new Date(startAt);
  const end = new Date(endAt);

  if (start < today || end > maxDate) {
    // Comment: Chỉ cho phép tạo lịch trong vòng 7 ngày kể từ hôm nay
    throw new AppError(
      "Chỉ được tạo lịch áp dụng trong vòng 7 ngày tới kể từ hôm nay",
      400,
    );
  }

  //check overlapping
  const overlap = await MenuSchedule.findOne({
    canteenId,
    status: "enabled",
    startAt: { $lt: endAt },
    endAt: { $gt: start },
  });

  if (overlap) {
    // Comment: Khoảng thời gian tạo lịch bị trùng với một lịch khác
    throw new AppError(
      "Khoảng thời gian này bị trùng với một lịch áp dụng khác",
      400,
    );
  }

  const schedule = await MenuSchedule.create({
    menuId,
    canteenId,
    startAt,
    endAt,
  });
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

  if (query.status) {
    filter.status = query.status;
  }

  return await MenuSchedule.find(filter)
    .populate("menuId")
    .sort({ startAt: -1 });
};

/**
 * Get menu schedule by ID
 * @param {string} id - Schedule ID
 * @returns {Promise<Object>} Schedule object
 */
export const getMenuScheduleById = async (id) => {
  const schedule = await MenuSchedule.findById(id)
    .populate({
      path: "menuId",
      populate: {
        path: "items.productId",
      },
    });

  if (!schedule) {
    throw new AppError("Không tìm thấy lịch thực đơn", 404);
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
  const schedule = await MenuSchedule.findById(id);

  if (!schedule) {
    throw new AppError("Không tìm thấy lịch thực đơn", 404);
  }

  const now = new Date();
  const isRunning =
    now >= schedule.startAt && now <= schedule.endAt;

  // Không cho update nếu đang chạy
  if (isRunning) {
    // Comment: Không cho phép chỉnh sửa lịch đang trong thời gian hoạt động
    throw new AppError(
      "Không thể chỉnh sửa lịch đang trong thời gian hoạt động",
      400,
    );
  }

  const newStart = updateData.startAt
    ? new Date(updateData.startAt)
    : schedule.startAt;

  const newEnd = updateData.endAt
    ? new Date(updateData.endAt)
    : schedule.endAt;

  if (newStart >= newEnd) {
    throw new AppError(
      "Thời gian bắt đầu phải trước thời gian kết thúc",
      400,
    );
  }

  // Check overlap (loại trừ chính nó)
  const overlap = await MenuSchedule.findOne({
    _id: { $ne: id },
    canteenId: schedule.canteenId,
    status: "enabled",
    startAt: { $lt: newEnd },
    endAt: { $gt: newStart },
  });

  if (overlap) {
    // Comment: Khoảng thời gian mới bị trùng với một lịch đang hoạt động khác
    throw new AppError(
      "Khoảng thời gian mới bị trùng với một lịch đang hoạt động khác",
      400,
    );
  }

  schedule.startAt = newStart;
  schedule.endAt = newEnd;

  await schedule.save();

  return schedule;
};

export const toggleScheduleStatus = async (scheduleId) => {
  const schedule = await MenuSchedule.findById(scheduleId);

  if (!schedule) {
    throw new AppError("Không tìm thấy lịch thực đơn", 404);
  }

  const now = new Date();
  const isRunning =
    now >= schedule.startAt && now <= schedule.endAt;

  // =============================
  // CASE 1: ĐANG ENABLE → muốn DISABLE
  // =============================
  if (schedule.status === "enabled") {
    // Không cho tắt nếu đang chạy
    if (isRunning) {
      throw new AppError(
        "Không thể tắt lịch đang trong thời gian hoạt động",
        400,
      );
    }

    schedule.status = "disabled";
    await schedule.save();

    // Sau khi tắt, nếu không còn lịch nào enabled (chưa hết hạn) cho menu này thì chuyển menu sang inactive
    const hasOtherEnabled = await MenuSchedule.exists({
      _id: { $ne: scheduleId },
      menuId: schedule.menuId,
      canteenId: schedule.canteenId,
      status: "enabled",
      endAt: { $gte: now },
    });

    if (!hasOtherEnabled) {
      await Menu.findByIdAndUpdate(schedule.menuId, { status: "inactive" });
    }

    return schedule;
  }

  // =============================
  // CASE 2: ĐANG DISABLED → muốn ENABLE
  // =============================
  if (schedule.status === "disabled") {
    // Không cho bật nếu đã hết hạn
    if (schedule.endAt < now) {
      throw new AppError(
        "Không thể bật lịch đã hết thời gian áp dụng",
        400,
      );
    }

    // Check overlap với schedule khác
    const overlap = await MenuSchedule.findOne({
      _id: { $ne: scheduleId },
      canteenId: schedule.canteenId,
      status: "enabled",
      startAt: { $lt: schedule.endAt },
      endAt: { $gt: schedule.startAt },
    });

    if (overlap) {
      throw new AppError(
        "Khoảng thời gian này bị trùng với một lịch đang hoạt động khác",
        400,
      );
    }

    schedule.status = "enabled";
    await schedule.save();

    // Khi bật một lịch hợp lệ, đảm bảo menu ở trạng thái active
    await Menu.findByIdAndUpdate(schedule.menuId, { status: "active" });

    return schedule;
  }

  return schedule;
};

export const duplicateSchedule = async (scheduleId, newStart, newEnd) => {
  const oldSchedule = await MenuSchedule.findById(scheduleId);

  if (!oldSchedule) {
    throw new AppError("Không tìm thấy lịch thực đơn để nhân bản", 404);
  }

  const now = new Date();
  const start = new Date(newStart);

  // Không cho nhân bản lịch về thời điểm trong quá khứ
  if (start < now) {
    throw new AppError(
      "Không thể nhân bản lịch về thời điểm trong quá khứ",
      400,
    );
  }

  return await createMenuSchedule({
    menuId: oldSchedule.menuId,
    canteenId: oldSchedule.canteenId,
    startAt: newStart,
    endAt: newEnd,
  });
};

export const getCurrentMenuByCanteen = async (canteenId) => {
  const now = new Date()
  const schedule = await MenuSchedule.findOne({
    canteenId,
    status: "enabled",
    startAt: { $lte: now },
    endAt: { $gte: now },
  }).
    populate({
      path: "menuId",
      populate: { path: "items.productId", },
    })
  return schedule;
}


/**
 * Delete menu schedule
 * @param {string} id - Schedule ID
 */
export const deleteMenuSchedule = async (id) => {
  const schedule = await MenuSchedule.findById(id);

  if (!schedule) {
    throw new AppError("Không tìm thấy lịch thực đơn", 404);
  }

  const now = new Date();
  const isRunning =
    now >= schedule.startAt && now <= schedule.endAt;

  if (schedule.status === "enabled" && isRunning) {
    // Comment: Không cho phép xóa lịch đang trong thời gian hoạt động
    throw new AppError(
      "Không thể xóa lịch đang trong thời gian hoạt động",
      400,
    );
  }

  // Comment: Khi xóa một lịch, xóa thêm các lịch khác trùng khoảng thời gian
  // cùng căng tin và cùng thực đơn, tránh phải xóa nhiều lần cho cùng 1 menu
  await MenuSchedule.deleteMany({
    canteenId: schedule.canteenId,
    menuId: schedule.menuId,
    startAt: { $lt: schedule.endAt },
    endAt: { $gt: schedule.startAt },
  });

  return true;
};

