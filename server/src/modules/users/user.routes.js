import express from "express";

import { createUser, getUsers, updateUser, updateUserStatus } from "./user.controller.js";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { USER_ROLES } from "../../constants/roles.js";
import { requirePasswordChangeCompleted } from "../../middleware/requirePasswordChangeCompleted.js";

const router = express.Router();

router.use(authenticate);
router.use(requirePasswordChangeCompleted);

router.route("/").get(authorize(USER_ROLES.ADMIN), getUsers).post(authorize(USER_ROLES.ADMIN), createUser);
router.patch("/:userId/status", authorize(USER_ROLES.ADMIN), updateUserStatus);
router.patch("/:userId", authorize(USER_ROLES.ADMIN), updateUser);

export default router;
