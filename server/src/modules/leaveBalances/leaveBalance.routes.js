import express from "express";

import { getMyLeaveBalances, getUserLeaveBalances, adjustUserLeaveBalance } from "./leaveBalance.controller.js";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { requirePasswordChangeCompleted } from "../../middleware/requirePasswordChangeCompleted.js";

import { USER_ROLES } from "../../constants/roles.js";

const router = express.Router();

router.use(authenticate);
router.use(requirePasswordChangeCompleted);

router.get("/me", getMyLeaveBalances);
router.get("/user/:userId", authorize(USER_ROLES.HR_MANAGER, USER_ROLES.ADMIN), getUserLeaveBalances);

router.post("/user/:userId/adjustments", authorize(USER_ROLES.HR_MANAGER, USER_ROLES.ADMIN), adjustUserLeaveBalance);

export default router;
