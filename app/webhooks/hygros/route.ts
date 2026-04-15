import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    console.log("[v0] Hygros webhook received:", body)

    // Verify webhook signature/authentication if Hygros provides it
    // const signature = req.headers.get('x-hygros-signature')
    // if (!verifySignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }

    const { id: transactionId, status, customer, amount } = body

    if (status === "paid") {
      const supabase = createAdminClient()

      // Update payment status in cpf_tracking table
      const { error } = await supabase
        .from("cpf_tracking")
        .update({
          payment_status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("cpf", customer?.document?.number)

      if (error) {
        console.error("[v0] Error updating payment status:", error)
      } else {
        console.log("[v0] Payment confirmed for CPF:", customer?.document?.number)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
