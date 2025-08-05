import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Webhook } from "svix";

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!SIGNING_SECRET) {
    return new Error("Webhook signing secret is not set");
  }

  const wh = new Webhook(SIGNING_SECRET);

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_signature = headerPayload.get("svix-signature");
  const svix_timestamp = headerPayload.get("svix-timestamp");

  if (!svix_id || !svix_signature || !svix_timestamp) {
    return new Response("Missing required headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;
  console.log("Verifying webhook event with svix_id:", svix_id);
  console.log("Signature:", svix_signature);
  console.log("Timestamp:", svix_timestamp);
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-signature": svix_signature,
      "svix-timestamp": svix_timestamp,
    }) as WebhookEvent;
  } catch (error) {
    console.error("Webhook verification failed:", error);
    return new Response("Error: Verification error", { status: 400 });
  }

  const { id } = evt.data;
  const eventType = evt.type;
  console.log("Received webhook event:", {
    id,
    type: eventType,
    data: evt.data,
  });
  return new Response("Webhook received", { status: 200 });
}
