import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { cpf } = await request.json()
    const supabase = await createClient()

    console.log("[v0] Logging regularizar click for CPF:", cpf)

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
      const { error: updateError } = await supabase
        .from("cpf_tracking")
        .update({
          clicked_regularizar: true,
          clicked_regularizar_at: new Date().toISOString(),
        })
        .eq("id", existing.id)

      if (updateError) {
        console.error("[v0] Error updating regularizar click:", updateError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in log-regularizar:", error)
    return NextResponse.json({ error: "Failed to log regularizar click" }, { status: 500 })
  }
}
