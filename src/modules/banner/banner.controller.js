import catchAsync from "../../utils/catchAsync.js";
import * as bannerService from "./banner.service.js";

export const createBanner = catchAsync(async (req, res) => {
  const banner = await bannerService.createBanner(req.body, req.user._id);
  res.status(201).json({ status: "success", data: { banner } });
});

export const getAllBanners = catchAsync(async (req, res) => {
  const banners = await bannerService.getAllBanners(req.query);
  res
    .status(200)
    .json({ status: "success", results: banners.length, data: { banners } });
});

export const getActiveBanners = catchAsync(async (req, res) => {
  const banners = await bannerService.getActiveBanners(req.query.canteenId);
  res
    .status(200)
    .json({ status: "success", results: banners.length, data: { banners } });
});

export const getBannerById = catchAsync(async (req, res) => {
  const banner = await bannerService.getBannerById(req.params.id);
  res.status(200).json({ status: "success", data: { banner } });
});

export const updateBanner = catchAsync(async (req, res) => {
  const banner = await bannerService.updateBanner(req.params.id, req.body);
  res.status(200).json({ status: "success", data: { banner } });
});

export const deleteBanner = catchAsync(async (req, res) => {
  await bannerService.deleteBanner(req.params.id);
  res.status(204).json({ status: "success", data: null });
});

export const reorderBanners = catchAsync(async (req, res) => {
  const banners = await bannerService.reorderBanners(req.body.bannerOrders);
  res.status(200).json({ status: "success", data: { banners } });
});
