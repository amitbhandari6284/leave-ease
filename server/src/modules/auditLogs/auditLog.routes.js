import express from "express";

import { getAuditLogs } from "./auditLog.controller.js";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { requirePasswordChangeCompleted } from "../../middleware/requirePasswordChangeCompleted.js";

import { USER_ROLES } from "../../constants/roles.js";

const router = express.Router();

router.use(authenticate);
router.use(requirePasswordChangeCompleted);

router.get("/", authorize(USER_ROLES.ADMIN), getAuditLogs);

export default router;
