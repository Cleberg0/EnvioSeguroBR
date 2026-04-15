import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cpf = searchParams.get("cpf")

    if (!cpf) {
      return NextResponse.json({ error: "CPF required" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const cleanCpf = cpf.replace(/\D/g, "")

    const { data, error } = await supabase
      .from("cpf_tracking")
      .select("payment_status, payment_confirmed_at")
      .eq("cpf", cleanCpf)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error("[Check Status] Error:", error)
      return NextResponse.json({ status: "pending" })
    }

    return NextResponse.json({
      status: data.payment_status || "pending",
      confirmedAt: data.payment_confirmed_at,
    })
  } catch (error) {
    console.error("[Check Status] Error:", error)
    return NextResponse.json({ status: "pending" })
  }
}
