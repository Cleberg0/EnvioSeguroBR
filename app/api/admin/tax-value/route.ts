import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from("company_settings").select("tax_value").limit(1).single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found
      console.error("Error fetching tax value:", error)
    }

    return NextResponse.json({ value: data?.tax_value || 3543 })
  } catch (error) {
    console.error("Error fetching tax value:", error)
    return NextResponse.json({ value: 3543 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { value } = await req.json()
    const supabase = createAdminClient()

    const { data: existing } = await supabase.from("company_settings").select("id").limit(1).single()

    if (existing?.id) {
      // Update existing row
      const { error } = await supabase
        .from("company_settings")
        .update({
          tax_value: value,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)

      if (error) {
        console.error("Error updating tax value:", error)
        throw error
      }
    } else {
      // Insert new row if none exists
      const { error } = await supabase.from("company_settings").insert({
        company_name: "Rastreamento de Encomendas",
        tax_value: value,
      })

      if (error) {
        console.error("Error inserting tax value:", error)
        throw error
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving tax value:", error)
    return NextResponse.json({ error: "Failed to save tax value" }, { status: 500 })
  }
}
