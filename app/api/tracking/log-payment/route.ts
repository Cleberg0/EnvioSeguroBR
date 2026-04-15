import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { cpf, paymentId, status } = await request.json()
    const supabase = await createClient()

    console.log("[v0] Logging payment for CPF:", cpf, "Payment ID:", paymentId, "Status:", status)

    const { data: existing, error: fetchError } = await supabase
      .from("cpf_tracking")
      .select("*")
      .eq("cpf", cpf)
      .order("consulted_at", { ascending: false })
      .limit(1)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("[v0] Error fetching tracking:", fetchError)
    }

    if (existing) {
      const updateData: any = {
        payment_generated: true,
        payment_id: paymentId,
        payment_status: status || "pending",
      }

      if (status === "paid") {
        updateData.paid_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase.from("cpf_tracking").update(updateData).eq("id", existing.id)

      if (updateError) {
        console.error("[v0] Error updating payment:", updateError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in log-payment:", error)
    return NextResponse.json({ error: "Failed to log payment" }, { status: 500 })
  }
}
