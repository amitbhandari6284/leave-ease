import express from "express";

import {
  submitLeaveRequest,
  getLeaveRequest,
  getMyLeaveRequests,
  cancelLeaveRequest,
  getReviewQueue,
  decideLeaveRequest,
} from "./leaveRequest.controller.js";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { USER_ROLES } from "../../constants/roles.js";
import { requirePasswordChangeCompleted } from "../../middleware/requirePasswordChangeCompleted.js";

const router = express.Router();

router.use(authenticate);
router.use(requirePasswordChangeCompleted);

router.get("/review-queue", authorize(USER_ROLES.HR_MANAGER, USER_ROLES.ADMIN), getReviewQueue);
router.get("/me", authorize(USER_ROLES.EMPLOYEE, USER_ROLES.HR_MANAGER), getMyLeaveRequests);
router.get("/:leaveRequestId", authorize(USER_ROLES.EMPLOYEE, USER_ROLES.HR_MANAGER, USER_ROLES.ADMIN), getLeaveRequest);
router.patch("/:leaveRequestId/decision", authorize(USER_ROLES.HR_MANAGER, USER_ROLES.ADMIN), decideLeaveRequest);
router.patch("/:leaveRequestId/cancel", authorize(USER_ROLES.EMPLOYEE, USER_ROLES.HR_MANAGER), cancelLeaveRequest);
router.post("/", authorize(USER_ROLES.EMPLOYEE, USER_ROLES.HR_MANAGER), submitLeaveRequest);

export default router;
