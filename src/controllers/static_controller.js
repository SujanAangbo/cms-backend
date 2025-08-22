const { asyncHandler, successResponse } = require('../utils/response.util');

const Notice = require('../models/notice.model');


exports.getNotices = asyncHandler(async (req, res) => {
  console.log("here inside ");

  const { targetAudience, department, isActive } = req.query;

  console.log("targetAudience" + targetAudience);

  const query = {};
  if (targetAudience) query.targetAudience = targetAudience;
  if (department) query.department = department;
  if (isActive !== undefined) query.isActive = isActive;

  const notices = await Notice.find(query)
    .populate('createdBy', 'firstName lastName')
    .sort({ priority: -1, createdAt: -1 });

  successResponse(res, 200, 'Notices retrieved successfully', notices);
});
