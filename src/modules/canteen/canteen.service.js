import Canteen from "./canteen.model.js";
import AppError from "../../utils/AppError.js";
import User from "../user/user.model.js";

// Kiểm tra trường hợp KHÔNG HỢP LỆ:
// - Hôm nay (today) đang được đánh dấu là ngày nghỉ trong offDates
// - Nhưng thời điểm hiện tại (now) lại ĐANG NẰM TRONG khung giờ mở cửa
// Nếu rơi vào trường hợp này -> không cho phép update (bên dưới sẽ throw AppError)
const isTodayOffDuringOpenTime = (canteen) => {
  // Nếu không có offDates hoặc mảng rỗng thì chắc chắn không phải trường hợp hôm nay nghỉ
  if (!Array.isArray(canteen.offDates) || canteen.offDates.length === 0)
    return false;

  const now = new Date();

  // Chuỗi ngày hôm nay theo định dạng YYYY-MM-DD, ví dụ: 2026-03-05
  const todayStr = now.toISOString().slice(0, 10);

  // Nếu hôm nay không nằm trong danh sách ngày nghỉ -> không vi phạm
  if (!canteen.offDates.includes(todayStr)) return false;

  // Tách giờ mở cửa openingTime ("HH:mm") thành số giờ/phút, mặc định 00:00 nếu không có
  const [openH = 0, openM = 0] = (canteen.openingTime || "00:00")
    .split(":")
    .map(Number);

  // Tách giờ đóng cửa closingTime ("HH:mm") thành số giờ/phút, mặc định 23:59 nếu không có
  const [closeH = 23, closeM = 59] = (canteen.closingTime || "23:59")
    .split(":")
    .map(Number);

  // Quy đổi thời gian hiện tại và khung giờ mở cửa về đơn vị phút trong ngày
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  // Trả về true nếu "bây giờ" nằm trong khoảng [openMinutes, closeMinutes)
  // => hôm nay đang được đánh dấu nghỉ nhưng thực tế đang trong giờ hoạt động
  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
};

// Tạo mới canteen và gắn vào tài khoản user (user.canteenId)
export const createCanteen = async (userId, canteenData) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  // Mỗi user chỉ được gắn với 1 canteen
  if (user.canteenId) throw new AppError("User already has a canteen", 400);

  const canteen = await Canteen.create(canteenData);

  user.canteenId = canteen._id;
  user.campusId = canteen.campusId;
  await user.save();

  return canteen;
};

// Lấy tất cả canteen (có filter đơn giản theo status, location)
export const getAllCanteens = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.location) filter.location = query.location;
  if (query.campusId) filter.campusId = query.campusId;

  return Canteen.find(filter)
    .populate("campusId", "name code")
    .sort({ createdAt: -1 });
};

export const getCanteenById = async (id) => {
  const canteen = await Canteen.findById(id).populate("campusId", "name code");
  if (!canteen) {
    throw new AppError("Canteen not found", 404);
  }
  return canteen;
};

export const updateCanteen = async (id, updateData, currentUser) => {
  const canteen = await Canteen.findById(id);
  if (!canteen) {
    throw new AppError("Canteen not found", 404);
  }

  const isAdmin = currentUser?.role === "admin";
  const isManager = currentUser?.role === "manager";

  // Manager chỉ được chỉnh sửa canteen của chính mình
  if (isManager && String(currentUser?.canteenId || "") !== String(id)) {
    throw new AppError("Bạn chỉ có thể cập nhật căng tin của mình", 403);
  }

  // Manager không được tự duyệt đăng ký (pending -> active)
  if (
    isManager &&
    updateData?.status === "active" &&
    canteen.status === "pending"
  ) {
    throw new AppError("Chỉ admin mới có quyền duyệt đăng ký căng tin", 403);
  }

  // Chỉ admin/manager mới được cập nhật canteen
  if (!isAdmin && !isManager) {
    throw new AppError("Bạn không có quyền cập nhật căng tin", 403);
  }

  Object.assign(canteen, updateData);

  // Không cho bật chế độ nghỉ cho hôm nay nếu đang trong giờ mở cửa
  if (isTodayOffDuringOpenTime(canteen)) {
    throw new AppError(
      "Không thể đặt ngày hôm nay là ngày nghỉ khi đã trong giờ hoạt động",
      400,
    );
  }

  await canteen.save({ validateBeforeSave: true });

  return canteen;
};

// Duyệt đăng ký canteen (admin only)
export const reviewCanteenRegistration = async (id, decision, reviewedBy) => {
  const canteen = await Canteen.findById(id);

  if (!canteen) {
    throw new AppError("Canteen not found", 404);
  }

  if (canteen.status !== "pending") {
    throw new AppError("Chỉ có thể duyệt căng tin ở trạng thái chờ duyệt", 400);
  }

  // Quy ước: approve -> active, reject -> inactive
  canteen.status = decision === "approve" ? "active" : "inactive";
  await canteen.save({ validateBeforeSave: true });

  // Nếu từ chối đăng ký, cập nhật trạng thái user chủ canteen về inactive
  if (decision === "reject") {
    await User.updateMany(
      { canteenId: canteen._id, role: "manager" },
      { $set: { status: "inactive" } },
    );
  }

  return {
    canteen,
    reviewedBy,
  };
};

export const deleteCanteen = async (id) => {
  const canteen = await Canteen.findByIdAndDelete(id);
  if (!canteen) {
    throw new AppError("Canteen not found", 404);
  }

  // Xoá liên kết canteenId ở các user nếu có
  await User.updateMany({ canteenId: id }, { $unset: { canteenId: 1 } });
};
