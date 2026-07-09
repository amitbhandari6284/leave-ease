import express from "express";

import { getLeaveSummaryReport } from "./report.controller.js";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { requirePasswordChangeCompleted } from "../../middleware/requirePasswordChangeCompleted.js";

import { USER_ROLES } from "../../constants/roles.js";

const router = express.Router();

router.use(authenticate);
router.use(requirePasswordChangeCompleted);

router.get("/leave-summary", authorize(USER_ROLES.HR_MANAGER, USER_ROLES.ADMIN), getLeaveSummaryReport);

export default router;
