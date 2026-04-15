import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const supabase = await createClient()

    console.log("[v0] Hygros webhook received:", JSON.stringify(payload).substring(0, 200))

    const { id: paymentId, status, customer } = payload

    if (!paymentId) {
      return NextResponse.json({ error: "Missing payment ID" }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from("cpf_tracking")
      .update({
        payment_status: status,
        paid_at: status === "paid" ? new Date().toISOString() : null,
      })
      .eq("payment_id", paymentId)

    if (updateError) {
      console.error("[v0] Error updating payment status:", updateError)
      return NextResponse.json({ error: "Failed to update payment status" }, { status: 500 })
    }

    console.log("[v0] Payment status updated successfully:", paymentId, status)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in Hygros webhook:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
