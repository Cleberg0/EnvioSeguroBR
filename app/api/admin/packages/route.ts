import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listaId = searchParams.get("lista_id")
    
    const supabase = createAdminClient()

    let query = supabase.from("packages").select("*", { count: "exact" })
    
    // Filter by lista_id if provided
    if (listaId) {
      if (listaId === "sem_lista") {
        // Show packages without a list
        query = query.is("lista_id", null)
      } else {
        query = query.eq("lista_id", listaId)
      }
    }
    
    const {
      data: packages,
      error,
      count,
    } = await query.order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ packages, total: count })
  } catch (error) {
    console.error("[v0] Error fetching packages:", error)
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 })
  }
}
