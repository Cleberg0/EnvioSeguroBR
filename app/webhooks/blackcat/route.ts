import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    console.log("[BlackCat Webhook] ========== NEW WEBHOOK ==========")
    console.log("[BlackCat Webhook] Full Payload:", JSON.stringify(payload, null, 2))
    console.log("[BlackCat Webhook] Headers:", Object.fromEntries(request.headers.entries()))

    const status = payload.status || payload.event || payload.transaction?.status
    const transactionId = payload.transactionId || payload.transaction?.id || payload.id

    const cpf =
      payload.customer?.document?.number ||
      payload.customer?.cpf ||
      payload.customer?.taxId ||
      payload.payer?.document?.number ||
      payload.payer?.cpf ||
      payload.externalRef?.split("-")[1] ||
      payload.metadata?.cpf ||
      payload.transaction?.customer?.document?.number ||
      payload.transaction?.customer?.cpf

    console.log("[BlackCat Webhook] Extracted - Status:", status, "CPF:", cpf, "Transaction:", transactionId)

    const supabase = createAdminClient()
    await supabase
      .from("webhook_logs")
      .insert({
        provider: "blackcat",
        event_type: status || "unknown",
        transaction_id: transactionId || "none",
        cpf: cpf || "not_found",
        payload: payload,
        created_at: new Date().toISOString(),
      })
      .catch((err) => console.error("[BlackCat Webhook] Failed to log:", err))

    if (
      status &&
      ["PAID", "paid", "approved", "APPROVED", "confirmed", "CONFIRMED", "success", "SUCCESS"].includes(status)
    ) {
      if (cpf) {
        const cleanCpf = cpf.replace(/\D/g, "")

        const { error: updateError } = await supabase
          .from("cpf_tracking")
          .update({
            payment_status: "paid",
            payment_confirmed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("cpf", cleanCpf)
          .order("created_at", { ascending: false })
          .limit(1)

        if (updateError) {
          console.error("[BlackCat Webhook] Error updating payment:", updateError)
        } else {
          console.log("[BlackCat Webhook] ✓ Payment confirmed for CPF:", cleanCpf)
        }
      } else {
        console.error("[BlackCat Webhook] ❌ No CPF found in payload - check extraction logic")
      }
    } else {
      console.log("[BlackCat Webhook] Status not recognized as payment confirmation:", status)
    }

    return NextResponse.json({ received: true, status: "processed" })
  } catch (error) {
    console.error("[BlackCat Webhook] ❌ Error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
