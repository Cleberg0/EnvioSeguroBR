import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    console.log("[Payevo Webhook] Received:", JSON.stringify(body, null, 2))

    // Extract transaction data - handle various Payevo webhook formats
    const transactionId = body.id || body.transaction_id || body.transactionId
    const status = body.status || body.transaction_status || body.payment_status
    const amount = body.amount || body.paid_amount || body.value

    if (!transactionId) {
      console.log("[Payevo Webhook] No transaction ID found")
      return NextResponse.json({ received: true })
    }

    // Check if payment is approved
    const isPaid = ["paid", "approved", "completed", "confirmed", "PAID", "APPROVED", "COMPLETED"].includes(status)

    if (isPaid) {
      console.log("[Payevo Webhook] Payment approved for transaction:", transactionId)
      
      const supabase = createAdminClient()

      // Find the cpf_tracking record by transaction_id
      const { data: tracking, error: trackingError } = await supabase
        .from("cpf_tracking")
        .select("*, lista_id")
        .eq("transaction_id", transactionId)
        .maybeSingle()

      if (tracking) {
        // Update payment status
        await supabase
          .from("cpf_tracking")
          .update({
            payment_status: "paid",
            amount_paid: amount || 0,
            paid_at: new Date().toISOString(),
          })
          .eq("id", tracking.id)

        console.log("[Payevo Webhook] Updated cpf_tracking for CPF:", tracking.cpf)

        // Update list totals if lista_id exists
        if (tracking.lista_id) {
          const { data: currentList } = await supabase
            .from("lists")
            .select("total_paid, total_amount_paid")
            .eq("id", tracking.lista_id)
            .single()

          if (currentList) {
            await supabase
              .from("lists")
              .update({
                total_paid: (currentList.total_paid || 0) + 1,
                total_amount_paid: (currentList.total_amount_paid || 0) + (amount || 0),
              })
              .eq("id", tracking.lista_id)
          }
        }
      }
    }

    return NextResponse.json({ received: true, status: "processed" })
  } catch (error: any) {
    console.error("[Payevo Webhook] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Also handle GET for webhook verification
export async function GET() {
  return NextResponse.json({ status: "ok", message: "Payevo webhook endpoint" })
}
