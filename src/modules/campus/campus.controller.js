import catchAsync from "../../utils/catchAsync.js";
import * as campusService from "./campus.service.js";

/**
 * Lấy danh sách campus đang hoạt động
 * @route GET /api/campuses
 * @access Public / Dashboard
 */
export const getActiveCampuses = catchAsync(async (req, res) => {
    const campuses = await campusService.getActiveCampuses();

    res.status(200).json({
        status: "success",
        results: campuses.length,
        data: { campuses },
    });
});
