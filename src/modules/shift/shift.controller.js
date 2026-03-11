import catchAsync from "../../utils/catchAsync.js";
import * as shiftService from "./shift.service.js";
import {
  paginatedQuery,
  filterPresets,
  formatPaginatedResponse,
} from "../../utils/queryHelper.js";
import { Shift } from "./shift.model.js";
import Canteen from "../canteen/canteen.model.js";

const buildShiftScopeFilter = async (req) => {
  const baseFilter = {};

  if (req.user?.role === "admin") {
    if (req.query?.canteenId) {
      baseFilter.canteenId = req.query.canteenId;
      return baseFilter;
    }

    if (req.query?.campusId) {
      const canteenIds = await Canteen.find({ campusId: req.query.campusId }).distinct("_id");
      baseFilter.canteenId = { $in: canteenIds };
    }

    return baseFilter;
  }

  if (req.user?.canteenId) {
    baseFilter.canteenId = req.user.canteenId;
  }

  return baseFilter;
};

export const createShift = catchAsync(async (req, res) => {
  const shift = await shiftService.createShift(req.body);

  res.status(201).json({
    status: "success",
    data: {
      shift,
    },
  });
});

export const getAllShifts = catchAsync(async (req, res) => {
  const baseFilter = await buildShiftScopeFilter(req);

  const result = await paginatedQuery(Shift, req.query, {
    ...filterPresets.shift,
    baseFilter,
    populate: [{ path: "canteenId", select: "name location" }],
  });

  res.status(200).json(formatPaginatedResponse(result, "Lấy danh sách ca làm việc thành công"));
});

export const getShiftById = catchAsync(async (req, res) => {
  const shift = await shiftService.getShiftById(req.params.id);

  res.status(200).json({
    status: "success",
    data: {
      shift,
    },
  });
});

export const updateShift = catchAsync(async (req, res) => {
  const shift = await shiftService.updateShift(req.params.id, req.body);

  res.status(200).json({
    status: "success",
    data: {
      shift,
    },
  });
});

export const deleteShift = catchAsync(async (req, res) => {
  await shiftService.deleteShift(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});
