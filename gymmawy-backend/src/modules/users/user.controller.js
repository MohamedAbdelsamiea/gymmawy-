import * as service from "./user.service.js";
import { paginationSchema, parseOrThrow, buildPagination } from "../../utils/validation.js";

export async function getMe(req, res, next) {
  try {
    const me = await service.getMe(req.user.id);
    res.json({ user: me });
  } catch (e) { next(e); }
}

export async function updateMe(req, res, next) {
  try {
    const updated = await service.updateMe(req.user.id, req.body || {});
    res.json({ user: updated });
  } catch (e) { 
    // Handle Zod validation errors
    if (e.name === 'ZodError') {
      const error = new Error('Validation failed');
      error.status = 400;
      error.expose = true;
      error.details = e.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return next(error);
    }
    next(e); 
  }
}

export async function changeEmail(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: { message: 'Email is required' } });
    }
    
    const result = await service.changeEmail(req.user.id, email);
    res.json({ 
      message: 'Verification email sent to your new email address',
      ...result 
    });
  } catch (e) { next(e); }
}

export async function adminGetUserById(req, res, next) {
  try {
    const user = await service.adminGetUserById(req.params.id);
    if (!user) return res.status(404).json({ error: { message: "Not found" } });
    res.json({ user });
  } catch (e) { next(e); }
}

export async function adminListUsers(req, res, next) {
  try {
    const query = parseOrThrow(paginationSchema, req.query);
    const { skip, take } = buildPagination(query);
    const result = await service.adminListUsers({ skip, take, q: query.q });
    res.json(result);
  } catch (e) { next(e); }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    await service.changePassword(req.user.id, { currentPassword, newPassword });
    res.json({ success: true, message: "Password changed successfully" });
  } catch (e) { next(e); }
}

export async function deleteAccount(req, res, next) {
  try {
    await service.deleteAccount(req.user.id);
    res.json({ success: true, message: "Account deleted successfully" });
  } catch (e) { next(e); }
}

export async function adminCreateUser(req, res, next) {
  try {
    const user = await service.adminCreateUser(req.body);
    res.status(201).json({ user });
  } catch (e) { next(e); }
}

export async function adminUpdateUser(req, res, next) {
  try {
    const user = await service.adminUpdateUser(req.params.id, req.body);
    res.json({ user });
  } catch (e) { next(e); }
}

export async function adminDeleteUser(req, res, next) {
  try {
    await service.adminDeleteUser(req.params.id);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (e) { next(e); }
}

