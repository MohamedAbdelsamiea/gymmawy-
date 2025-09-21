import { Router } from "express";
import * as controller from "./auth.controller.js";

const router = Router();

router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/logout", controller.logout);
router.post("/refresh", controller.refresh);
router.post("/verify-email", controller.verifyEmail);
router.post("/verify-email-change", controller.verifyEmailChange);
router.post("/resend-verification", controller.resendVerification);
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);

export default router;

