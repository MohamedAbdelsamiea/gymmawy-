import { z } from "zod";

export function parseOrThrow(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errorMessages = result.error.issues ? 
      result.error.issues.map(e => e.message).join(", ") : 
      "Validation failed";
    const err = new Error(errorMessages);
    err.status = 400;
    err.expose = true;
    throw err;
  }
  return result.data;
}

export const paginationSchema = z.object({
  page: z.coerce.number().int().gte(1).default(1),
  pageSize: z.coerce.number().int().gte(1).lte(100).default(20),
  q: z.string().trim().optional(),
});

export function buildPagination({ page, pageSize }) {
  const take = pageSize;
  const skip = (page - 1) * pageSize;
  return { skip, take };
}


