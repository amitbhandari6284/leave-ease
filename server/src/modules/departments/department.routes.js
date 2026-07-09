import express from "express";

import {
  createDepartment,
  getDepartment,
  getDepartments,
  updateDepartment,
  updateDepartmentStatus,
} from "./department.controller.js";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { requirePasswordChangeCompleted } from "../../middleware/requirePasswordChangeCompleted.js";

import { USER_ROLES } from "../../constants/roles.js";

const router = express.Router();

router.use(authenticate);
router.use(requirePasswordChangeCompleted);

router.route("/").get(getDepartments).post(authorize(USER_ROLES.ADMIN), createDepartment);

router.patch("/:departmentId/status", authorize(USER_ROLES.ADMIN), updateDepartmentStatus);

router.route("/:departmentId").get(getDepartment).patch(authorize(USER_ROLES.ADMIN), updateDepartment);

export default router;
