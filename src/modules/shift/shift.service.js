import { Shift } from "./shift.model.js";
import AppError from "../../utils/AppError.js";

export const createShift = async (shiftData) => {
  return Shift.create(shiftData);
};

export const getShiftById = async (id) => {
  const shift = await Shift.findOne({
    _id: id,
    isDeleted: { $ne: true },
  }).populate("canteenId", "name location");

  if (!shift) {
    throw new AppError("Shift not found", 404);
  }

  return shift;
};

export const updateShift = async (id, updateData) => {
  const shift = await Shift.findOneAndUpdate(
    {
      _id: id,
      isDeleted: { $ne: true },
    },
    {
      $set: updateData,
      $inc: { version: 1 },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!shift) {
    throw new AppError("Shift not found", 404);
  }

  return shift;
};

export const deleteShift = async (id) => {
  const shift = await Shift.findOneAndDelete({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!shift) {
    throw new AppError("Shift not found", 404);
  }
};
