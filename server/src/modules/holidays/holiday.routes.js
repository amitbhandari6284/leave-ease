import express from "express";

import { createHoliday, getHolidays, updateHoliday, updateHolidayStatus } from "./holiday.controller.js";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { USER_ROLES } from "../../constants/roles.js";
import { requirePasswordChangeCompleted } from "../../middleware/requirePasswordChangeCompleted.js";

const router = express.Router();

router.use(authenticate);
router.use(requirePasswordChangeCompleted);

router.route("/").get(getHolidays).post(authorize(USER_ROLES.ADMIN), createHoliday);

router.patch("/:holidayId", authorize(USER_ROLES.ADMIN), updateHoliday);
router.patch("/:holidayId/status", authorize(USER_ROLES.ADMIN), updateHolidayStatus);

export default router;
