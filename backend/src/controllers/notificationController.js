const { paginateQuery } = require('../utils/paginate');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const Notification = require('../models/Notification');

const getNotifications = asyncHandler(async (req, res) => {
  const { items: notifications, pagination } = await paginateQuery(Notification, { user: req.user._id }, req,
    (q) => q.sort({ createdAt: -1 }), { defaultLimit: 20 });
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
  res.json({ success: true, count: notifications.length, unreadCount, pagination, notifications });
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw new ApiError(404, 'Notification not found');
  if (String(notification.user) !== String(req.user._id)) throw new ApiError(403, 'Not authorized');

  notification.isRead = true;
  await notification.save();
  res.json({ success: true, notification });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: 'All notifications marked as read' });
});

module.exports = { getNotifications, markAsRead, markAllAsRead };
