import { Router } from "express";
import { requireAuth, requireAdmin } from "../../middlewares/authMiddleware.js";
import * as controller from "./user.controller.js";

const router = Router();

router.get("/me", requireAuth, controller.getMe);
router.patch("/me", requireAuth, controller.updateMe);
router.put("/change-password", requireAuth, controller.changePassword);
router.post("/change-email", requireAuth, controller.changeEmail);
router.delete("/account", requireAuth, controller.deleteAccount);

router.get("/", requireAuth, requireAdmin, controller.adminListUsers);
router.get("/:id", requireAuth, requireAdmin, controller.adminGetUserById);
router.post("/", requireAuth, requireAdmin, controller.adminCreateUser);
router.patch("/:id", requireAuth, requireAdmin, controller.adminUpdateUser);
router.delete("/:id", requireAuth, requireAdmin, controller.adminDeleteUser);

export default router;

