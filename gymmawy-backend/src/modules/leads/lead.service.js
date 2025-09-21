import { getPrismaClient } from "../../config/db.js";
import * as notificationService from "../notifications/notification.service.js";

const prisma = getPrismaClient();

export async function submitLead({ name, email, mobileNumber, message }) {
  const lead = await prisma.lead.create({
    data: { name, email, mobileNumber, message },
  });

  // Create notification for lead submission
  try {
    await notificationService.notifyLeadSubmitted(lead);
  } catch (error) {
    console.error('Failed to create lead notification:', error);
    // Don't fail the lead creation if notification fails
  }

  return lead;
}

export async function listLeads() {
  return prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
}

export async function updateLeadStatus(id, status) {
  return prisma.lead.update({ where: { id }, data: { status } });
}

export async function getLeadById(id) {
  return prisma.lead.findUnique({ where: { id } });
}

export async function deleteLead(id) {
  return prisma.lead.delete({ where: { id } });
}

export async function getLeadStats() {
  const [
    totalLeads,
    newLeads,
    contactedLeads,
    recentLeads
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: 'NEW' } }),
    prisma.lead.count({ where: { status: 'CONTACTED' } }),
    prisma.lead.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return {
    totalLeads,
    newLeads,
    contactedLeads,
    recentLeads
  };
}

