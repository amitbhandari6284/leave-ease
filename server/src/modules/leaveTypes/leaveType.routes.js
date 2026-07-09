import express from "express";

import { createLeaveType, getLeaveTypes, updateLeaveType, updateLeaveTypeStatus } from "./leaveType.controller.js";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { USER_ROLES } from "../../constants/roles.js";
import { requirePasswordChangeCompleted } from "../../middleware/requirePasswordChangeCompleted.js";

const router = express.Router();

router.use(authenticate);
router.use(requirePasswordChangeCompleted);

router.route("/").get(getLeaveTypes).post(authorize(USER_ROLES.ADMIN), createLeaveType);
router.patch("/:leaveTypeId", authorize(USER_ROLES.ADMIN), updateLeaveType);
router.patch("/:leaveTypeId/status", authorize(USER_ROLES.ADMIN), updateLeaveTypeStatus);

export default router;
