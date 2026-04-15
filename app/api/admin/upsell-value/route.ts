import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase.from("company_settings").select("upsell_value").limit(1).single()

    if (error) throw error

    return NextResponse.json({ value: data?.upsell_value || 1653 })
  } catch (error) {
    console.error("[v0] Error fetching upsell value:", error)
    return NextResponse.json({ value: 1653 })
  }
}

export async function POST(request: Request) {
  try {
    const { value } = await request.json()
    const supabase = createAdminClient()

    // Get first record or create if doesn't exist
    const { data: existing } = await supabase.from("company_settings").select("id").limit(1).single()

    if (existing) {
      const { error } = await supabase.from("company_settings").update({ upsell_value: value }).eq("id", existing.id)

      if (error) throw error
    } else {
      const { error } = await supabase.from("company_settings").insert({ upsell_value: value })

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error saving upsell value:", error)
    return NextResponse.json({ error: "Failed to save upsell value" }, { status: 500 })
  }
}
