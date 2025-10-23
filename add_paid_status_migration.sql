-- Migration: Add PAID status to ProgrammePurchaseStatus enum
-- This migration adds the PAID status to the ProgrammePurchaseStatus enum

-- Add PAID to the ProgrammePurchaseStatus enum
ALTER TYPE "ProgrammePurchaseStatus" ADD VALUE 'PAID';

-- The migration is complete
-- The ProgrammePurchaseStatus enum now includes: PENDING, PAID, COMPLETE, CANCELLED
