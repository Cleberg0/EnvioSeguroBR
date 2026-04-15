import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { cpf, nome } = await request.json()
    const supabase = await createClient()

    // Get IP and user agent
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Check if this CPF has a lista_id associated
    const cleanCpf = cpf.replace(/\D/g, "")
    const { data: packageData } = await supabase
      .from("packages")
      .select("lista_id")
      .eq("cpf", cleanCpf)
      .single()

    const trackingData: any = {
      cpf: cleanCpf,
      nome,
      ip_address: ip,
      user_agent: userAgent,
    }

    // Add lista_id if found
    if (packageData?.lista_id) {
      trackingData.lista_id = packageData.lista_id
    }

    const { error } = await supabase.from("cpf_tracking").insert(trackingData)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error logging query:", error)
    return NextResponse.json({ error: "Failed to log query" }, { status: 500 })
  }
}
