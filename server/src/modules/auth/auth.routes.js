import express from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { login, logout, getCurrentUser, changePassword } from "./auth.controller.js";

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);

router.get("/me", authenticate, getCurrentUser);
router.patch("/change-password", authenticate, changePassword);

export default router;
