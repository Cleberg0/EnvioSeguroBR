import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[HorsePay Webhook] Received:", JSON.stringify(body).substring(0, 500))

    const supabase = createAdminClient()

    // Log webhook
    await supabase.from("webhook_logs").insert({
      provider: "horsepay",
      event_type: body.infraction_status ? "infraction" : (body.status === true ? "paid" : "failed"),
      transaction_id: String(body.external_id || ""),
      cpf: body.document || body.client_reference_id || "",
      payload: body,
    }).catch(() => {})

    // Ignore infraction callbacks
    if (body.infraction_status) {
      console.log("[HorsePay Webhook] Infraction callback, ignoring:", body.infraction_status)
      return NextResponse.json({ received: true })
    }

    const isPaid = body.status === true
    const transactionId = String(body.external_id || "")
    const cpf = body.document || body.client_reference_id || ""

    if (!isPaid) {
      console.log("[HorsePay Webhook] Payment not confirmed, status:", body.status)
      return NextResponse.json({ received: true })
    }

    console.log("[HorsePay Webhook] Payment confirmed for CPF:", cpf, "Transaction:", transactionId)

    // Update cpf_tracking
    if (cpf) {
      await supabase.from("cpf_tracking").update({
        payment_status: "paid",
        paid_at: new Date().toISOString(),
        payment_confirmed_at: new Date().toISOString(),
      }).eq("cpf", cpf.replace(/\D/g, ""))
        .catch((err) => console.error("[HorsePay Webhook] DB update error:", err))
    }

    if (transactionId) {
      await supabase.from("cpf_tracking").update({
        payment_status: "paid",
        paid_at: new Date().toISOString(),
        payment_confirmed_at: new Date().toISOString(),
      }).eq("payment_id", transactionId)
        .catch(() => {})
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("[HorsePay Webhook] Error:", error)
    return NextResponse.json({ error: "Webhook error" }, { status: 500 })
  }
}
