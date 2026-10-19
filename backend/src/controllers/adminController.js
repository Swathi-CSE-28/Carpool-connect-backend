const { paginateQuery } = require('../utils/paginate');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const User = require('../models/User');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const Report = require('../models/Report');
const LostItem = require('../models/LostItem');

const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalDrivers, totalPassengers, totalRides, activeRides, totalBookings, openReports, openLostItems] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'driver' }),
      User.countDocuments({ role: 'passenger' }),
      Ride.countDocuments(),
      Ride.countDocuments({ status: { $in: ['scheduled', 'preparing', 'started', 'pickup_in_progress', 'on_the_way'] } }),
      Booking.countDocuments(),
      Report.countDocuments({ status: 'open' }),
      LostItem.countDocuments({ status: 'open' })
    ]);

  res.json({
    success: true,
    stats: { totalUsers, totalDrivers, totalPassengers, totalRides, activeRides, totalBookings, openReports, openLostItems }
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const { role, q } = req.query;
  const query = {};
  if (role) query.role = role;
  if (q) query.$or = [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }];

  const { items: users, pagination } = await paginateQuery(User, query, req, (q) => q.sort({ createdAt: -1 }));
  res.json({ success: true, count: users.length, pagination, users });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(403, 'Cannot modify another admin account');

  user.isActive = isActive;
  await user.save();
  res.json({ success: true, user: user.toSafeObject() });
});

const getAllRides = asyncHandler(async (req, res) => {
  const { items: rides, pagination } = await paginateQuery(Ride, {}, req,
    (q) => q.populate('driver', 'name email').sort({ createdAt: -1 }));
  res.json({ success: true, count: rides.length, pagination, rides });
});

const getReports = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = status ? { status } : {};
  const { items: reports, pagination } = await paginateQuery(Report, query, req, (q) =>
    q.populate('reportedBy', 'name email').populate('reportedUser', 'name email').sort({ createdAt: -1 }));
  res.json({ success: true, count: reports.length, pagination, reports });
});

const updateReportStatus = asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body;
  const report = await Report.findById(req.params.id);
  if (!report) throw new ApiError(404, 'Report not found');

  if (status) report.status = status;
  if (adminNotes !== undefined) report.adminNotes = adminNotes;
  await report.save();

  res.json({ success: true, report });
});

const getLostItemsModeration = asyncHandler(async (req, res) => {
  const { items, pagination } = await paginateQuery(LostItem, {}, req, (q) =>
    q.populate('ride').populate('reportedBy', 'name email').sort({ createdAt: -1 }));
  res.json({ success: true, count: items.length, pagination, items });
});

module.exports = {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  getAllRides,
  getReports,
  updateReportStatus,
  getLostItemsModeration
};
