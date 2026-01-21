import { Banner } from "./banner.model.js";
import AppError from "../../utils/AppError.js";

export const createBanner = async (bannerData, userId) => {
  const banner = await Banner.create({ ...bannerData, createdBy: userId });
  return banner;
};

export const getAllBanners = async (query = {}) => {
  const filter = {};
  if (query.canteenId) filter.canteenId = query.canteenId;
  if (query.isActive !== undefined) filter.isActive = query.isActive;

  const banners = await Banner.find(filter)
    .populate("canteenId", "name")
    .sort({ order: 1, createdAt: -1 });
  return banners;
};

export const getActiveBanners = async (canteenId = null) => {
  const now = new Date();
  const filter = {
    isActive: true,
    $or: [
      { startDate: null, endDate: null },
      { startDate: { $lte: now }, endDate: { $gte: now } },
      { startDate: { $lte: now }, endDate: null },
      { startDate: null, endDate: { $gte: now } },
    ],
  };

  if (canteenId) {
    filter.$and = [{ $or: [{ canteenId }, { canteenId: null }] }];
  }

  const banners = await Banner.find(filter)
    .populate("canteenId", "name")
    .sort({ order: 1 });
  return banners;
};

export const getBannerById = async (id) => {
  const banner = await Banner.findById(id).populate("canteenId", "name");
  if (!banner) {
    throw new AppError("Banner not found", 404);
  }
  return banner;
};

export const updateBanner = async (id, updateData) => {
  const banner = await Banner.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!banner) {
    throw new AppError("Banner not found", 404);
  }
  return banner;
};

export const deleteBanner = async (id) => {
  const banner = await Banner.findByIdAndDelete(id);
  if (!banner) {
    throw new AppError("Banner not found", 404);
  }
};

export const reorderBanners = async (bannerOrders) => {
  const bulkOps = bannerOrders.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: id },
      update: { order },
    },
  }));

  await Banner.bulkWrite(bulkOps);
  return getAllBanners({ isActive: true });
};
