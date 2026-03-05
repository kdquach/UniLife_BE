import Campus from "./campus.model.js";

/**
 * Lấy danh sách campus đang hoạt động
 * @returns {Promise<Array>} Danh sách campus
 */
export const getActiveCampuses = async () => {
    const campuses = await Campus.find({ status: "active" }).sort({ name: 1 });
    return campuses;
};
