import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, newsletterSubscriptionsTable, quoteRequestsTable } from "@workspace/db";
import {
  CreateQuoteRequestBody,
  CreateQuoteRequestResponse,
  SubscribeNewsletterBody,
  SubscribeNewsletterResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/quote-requests", async (req, res): Promise<void> => {
  const parsed = CreateQuoteRequestBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid quote request");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [request] = await db
    .insert(quoteRequestsTable)
    .values({
      customerName: parsed.data.customerName.trim(),
      phone: parsed.data.phone.trim(),
      businessName: parsed.data.businessName?.trim() || null,
      notes: parsed.data.notes?.trim() || null,
      items: parsed.data.items,
      status: "received",
    })
    .returning();

  res.status(201).json(
    CreateQuoteRequestResponse.parse({
      id: request.id,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
    }),
  );
});

router.post("/newsletter-subscriptions", async (req, res): Promise<void> => {
  const parsed = SubscribeNewsletterBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid newsletter subscription");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const [inserted] = await db
    .insert(newsletterSubscriptionsTable)
    .values({ email })
    .onConflictDoNothing({ target: newsletterSubscriptionsTable.email })
    .returning({ id: newsletterSubscriptionsTable.id });

  const existing = inserted ?? (
    await db
      .select({ id: newsletterSubscriptionsTable.id })
      .from(newsletterSubscriptionsTable)
      .where(eq(newsletterSubscriptionsTable.email, email))
      .limit(1)
  )[0];

  res.status(201).json(
    SubscribeNewsletterResponse.parse({
      id: existing.id,
      status: "subscribed",
    }),
  );
});

export default router;