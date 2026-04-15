import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { cpf } = await request.json()
    const supabase = await createClient()

    // Update the most recent query for this CPF
    const { error } = await supabase
      .from("cpf_tracking")
      .update({
        pix_copied: true,
        pix_copied_at: new Date().toISOString(),
      })
      .eq("cpf", cpf.replace(/\D/g, ""))
      .order("consulted_at", { ascending: false })
      .limit(1)

    if (error) throw error

    console.log("[v0] PIX copy logged for CPF:", cpf)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error logging PIX copy:", error)
    return NextResponse.json({ error: "Failed to log PIX copy" }, { status: 500 })
  }
}
