import LeaveBalance from "./leaveBalance.model.js";
import LeaveType from "../leaveTypes/leaveType.model.js";

export async function initializeLeaveBalancesForUser(userId, year = new Date().getFullYear()) {
  const leaveTypes = await LeaveType.find({
    isActive: true,
    yearlyAllowance: {
      $gt: 0,
    },
  }).select("_id yearlyAllowance");

  if (leaveTypes.length === 0) {
    return [];
  }

  const operations = leaveTypes.map((leaveType) => ({
    updateOne: {
      filter: {
        user: userId,
        leaveType: leaveType._id,
        year,
      },

      update: {
        $setOnInsert: {
          user: userId,
          leaveType: leaveType._id,
          year,
          entitled: leaveType.yearlyAllowance,
          carriedForward: 0,
          used: 0,
          pending: 0,
          adjustments: 0,
        },
      },

      upsert: true,
    },
  }));

  await LeaveBalance.bulkWrite(operations);

  return LeaveBalance.find({
    user: userId,
    year,
  }).populate("leaveType", "name code color yearlyAllowance isPaid allowHalfDay");
}
