import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("[MasterFy Webhook] Received:", JSON.stringify(body).substring(0, 500))

    const transactionHash = body.transaction_hash || body.hash || body.id
    const status = body.status

    if (!transactionHash) {
      return NextResponse.json({ error: "No transaction hash" }, { status: 400 })
    }

    if (status === "paid" || status === "approved") {
      try {
        const supabase = createAdminClient()
        await supabase.from("cpf_tracking").update({
          payment_status: "paid",
          paid_at: new Date().toISOString(),
        }).eq("payment_id", transactionHash)
        console.log("[MasterFy Webhook] Payment confirmed for:", transactionHash)
      } catch (dbError) {
        console.error("[MasterFy Webhook] DB error:", dbError)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[MasterFy Webhook] Error:", error)
    return NextResponse.json({ error: "Webhook error" }, { status: 500 })
  }
}
