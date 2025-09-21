import * as service from "./auth.service.js";
import { parseOrThrow } from "../../utils/validation.js";
import { registerSchema, loginSchema, emailTokenSchema, forgotSchema, resetSchema } from "./validators.js";

export async function register(req, res, next) {
  try {
    const input = parseOrThrow(registerSchema, req.body || {});
    const result = await service.registerUser(input);
    res.status(201).json({ user: result, message: "Registration successful. Check your email to verify." });
  } catch (e) { next(e); }
}

export async function login(req, res, next) {
  try {
    const { identifier, password } = parseOrThrow(loginSchema, req.body || {});
    const { accessToken, refreshToken, user } = await service.loginUser({ identifier, password });
    // HttpOnly cookie for refresh token (optional; also return in body for non-cookie clients)
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: Number(process.env.REFRESH_COOKIE_MS || 30 * 24 * 60 * 60 * 1000),
    });
    res.json({ accessToken, refreshToken, user });
  } catch (e) { next(e); }
}

export async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    await service.logoutUser({ refreshToken: token });
    res.clearCookie("refreshToken");
    res.json({ success: true });
  } catch (e) { next(e); }
}

export async function verifyEmail(req, res, next) {
  try {
    const { token, email } = parseOrThrow(emailTokenSchema, req.body || {});
    const result = await service.verifyEmailToken({ token, email });
    res.json(result);
  } catch (e) { next(e); }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = parseOrThrow(forgotSchema, req.body || {});
    await service.startPasswordReset({ email });
    res.json({ success: true });
  } catch (e) { next(e); }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, email, newPassword } = parseOrThrow(resetSchema, req.body || {});
    await service.resetPassword({ token, email, newPassword });
    res.json({ success: true });
  } catch (e) { next(e); }
}

export async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken || 
                        req.headers.authorization?.replace('Bearer ', '') || 
                        req.body?.refreshToken;
    const { accessToken, refreshToken: newRefreshToken, user } = await service.refreshToken({ refreshToken });
    
    if (newRefreshToken) {
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        maxAge: Number(process.env.REFRESH_COOKIE_MS || 30 * 24 * 60 * 60 * 1000),
      });
    }
    
    res.json({ accessToken, refreshToken: newRefreshToken, user });
  } catch (e) { next(e); }
}

export async function resendVerification(req, res, next) {
  try {
    const { email, language = 'en' } = parseOrThrow(forgotSchema, req.body || {});
    await service.resendVerificationEmail({ email, language });
    res.json({ success: true, message: "Verification email sent" });
  } catch (e) { next(e); }
}

export async function verifyEmailChange(req, res, next) {
  try {
    const { token, email } = parseOrThrow(emailTokenSchema, req.body || {});
    const result = await service.verifyEmailChangeToken({ token, email });
    res.json(result);
  } catch (e) { next(e); }
}

