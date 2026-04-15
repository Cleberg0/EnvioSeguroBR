import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase.from("company_settings").select("*").limit(1).single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return NextResponse.json(
      data || {
        company_name: "J&T Express",
        logo_url: "/images/jet.jpg",
        banner_url: "",
      },
    )
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Erro ao carregar configurações" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { company_name, logo_url, banner_url } = await request.json()
    const supabase = createAdminClient()

    const { data: existing } = await supabase.from("company_settings").select("id").limit(1).single()

    if (existing) {
      const { error } = await supabase
        .from("company_settings")
        .update({ company_name, logo_url, banner_url, updated_at: new Date().toISOString() })
        .eq("id", existing.id)

      if (error) throw error
    } else {
      const { error } = await supabase.from("company_settings").insert({ company_name, logo_url, banner_url })

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving settings:", error)
    return NextResponse.json({ error: "Erro ao salvar configurações" }, { status: 500 })
  }
}
