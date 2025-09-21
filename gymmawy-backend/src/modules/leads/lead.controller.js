import * as service from "./lead.service.js";
import { z } from "zod";
import { parseOrThrow } from "../../utils/validation.js";

export async function submit(req, res, next) {
  try {
    const schema = z.object({
      name: z.string().trim().optional(),
      email: z.string().email(),
      mobileNumber: z.string().trim(),
      message: z.string().optional(),
    });
    const data = parseOrThrow(schema, req.body || {});
    const lead = await service.submitLead(data);
    res.status(201).json({ lead });
  } catch (e) { next(e); }
}

export async function list(_req, res, next) {
  try {
    const items = await service.listLeads();
    res.json({ items });
  } catch (e) { next(e); }
}

export async function getById(req, res, next) {
  try {
    const lead = await service.getLeadById(req.params.id);
    if (!lead) return res.status(404).json({ error: { message: "Lead not found" } });
    res.json({ lead });
  } catch (e) { next(e); }
}

export async function updateStatus(req, res, next) {
  try {
    const schema = z.object({ status: z.enum(["NEW", "CONTACTED"]) });
    const { status } = parseOrThrow(schema, req.body || {});
    const lead = await service.updateLeadStatus(req.params.id, status);
    res.json({ lead });
  } catch (e) { next(e); }
}

export async function deleteLead(req, res, next) {
  try {
    await service.deleteLead(req.params.id);
    res.status(204).send();
  } catch (e) { next(e); }
}

export async function getStats(req, res, next) {
  try {
    const stats = await service.getLeadStats();
    res.json({ stats });
  } catch (e) { next(e); }
}

