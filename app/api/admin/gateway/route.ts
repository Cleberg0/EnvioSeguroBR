import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("gateway_settings").select("*").eq("is_active", true).single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching gateway settings:", error)
    return NextResponse.json({ error: "Failed to fetch gateway settings" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("gateway_settings")
      .update({
        gateway_name: body.gateway_name,
        api_url: body.api_url,
        secret_key: body.secret_key,
        company_id: body.company_id,
        updated_at: new Date().toISOString(),
      })
      .eq("is_active", true)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error saving gateway settings:", error)
    return NextResponse.json({ error: "Failed to save gateway settings" }, { status: 500 })
  }
}
