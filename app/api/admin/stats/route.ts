import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Get total packages
    const { count: total } = await supabase.from("packages").select("*", { count: "exact", head: true })

    // Get packages by status
    const { count: postado } = await supabase
      .from("packages")
      .select("*", { count: "exact", head: true })
      .eq("pedido_postado", true)
      .eq("pedido_em_rota", false)

    const { count: emRota } = await supabase
      .from("packages")
      .select("*", { count: "exact", head: true })
      .eq("pedido_em_rota", true)
      .eq("pedido_entregue", false)

    const { count: taxado } = await supabase
      .from("packages")
      .select("*", { count: "exact", head: true })
      .eq("pedido_taxado", true)

    const { count: entregue } = await supabase
      .from("packages")
      .select("*", { count: "exact", head: true })
      .eq("pedido_entregue", true)

    const { count: approvedPayments } = await supabase
      .from("cpf_tracking")
      .select("*", { count: "exact", head: true })
      .eq("payment_status", "paid")

    // Get total amount paid
    const { data: paidData } = await supabase
      .from("cpf_tracking")
      .select("amount_paid")
      .eq("payment_status", "paid")
    
    const totalAmountPaid = paidData?.reduce((sum, row) => sum + (row.amount_paid || 0), 0) || 0

    return NextResponse.json({
      total: total || 0,
      postado: postado || 0,
      emRota: emRota || 0,
      taxado: taxado || 0,
      entregue: entregue || 0,
      approvedPayments: approvedPayments || 0,
      totalAmountPaid: totalAmountPaid,
    })
  } catch (error) {
    console.error("[v0] Error fetching stats:", error)
    return NextResponse.json(
      {
        total: 0,
        postado: 0,
        emRota: 0,
        taxado: 0,
        entregue: 0,
        approvedPayments: 0,
      },
      { status: 500 },
    )
  }
}
