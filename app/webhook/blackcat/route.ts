import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("[Blackcat Webhook] Received:", JSON.stringify(body))

    // Blackcat webhook payload structure
    const transactionId = body.transactionId || body.data?.transactionId
    const status = body.status || body.data?.status
    const amount = body.amount || body.data?.amount

    if (!transactionId) {
      console.log("[Blackcat Webhook] No transaction ID")
      return NextResponse.json({ received: true })
    }

    console.log("[Blackcat Webhook] Transaction:", transactionId, "Status:", status)

    // Only process PAID status
    if (status !== "PAID" && status !== "paid") {
      console.log("[Blackcat Webhook] Status not PAID, ignoring")
      return NextResponse.json({ received: true })
    }

    const supabase = createAdminClient()

    // Find the cpf_tracking record by transaction_id
    const { data: tracking, error: findError } = await supabase
      .from("cpf_tracking")
      .select("*, packages!inner(lista_id)")
      .eq("transaction_id", transactionId)
      .maybeSingle()

    if (findError || !tracking) {
      console.log("[Blackcat Webhook] Transaction not found in DB:", transactionId)
      return NextResponse.json({ received: true })
    }

    console.log("[Blackcat Webhook] Found tracking for CPF:", tracking.cpf)

    // Update payment status
    const { error: updateError } = await supabase
      .from("cpf_tracking")
      .update({
        payment_status: "paid",
        amount_paid: amount || 0,
        paid_at: new Date().toISOString(),
      })
      .eq("id", tracking.id)

    if (updateError) {
      console.error("[Blackcat Webhook] Update error:", updateError)
    }

    // Update list stats if we have lista_id
    const listaId = tracking.packages?.lista_id
    if (listaId) {
      // Increment total_paid and total_amount_paid on the list
      const { data: list } = await supabase
        .from("lists")
        .select("total_paid, total_amount_paid")
        .eq("id", listaId)
        .single()

      if (list) {
        await supabase
          .from("lists")
          .update({
            total_paid: (list.total_paid || 0) + 1,
            total_amount_paid: (list.total_amount_paid || 0) + (amount || 0),
          })
          .eq("id", listaId)
        
        console.log("[Blackcat Webhook] Updated list stats for:", listaId)
      }
    }

    console.log("[Blackcat Webhook] Payment confirmed for:", tracking.cpf)
    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("[Blackcat Webhook] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Also handle GET for webhook verification
export async function GET() {
  return NextResponse.json({ status: "ok", webhook: "blackcat" })
}
