import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("cpf_tracking").select("*").order("consulted_at", { ascending: false })

    if (error) throw error

    // Calculate stats
    const totalPixCopied = data?.filter((t) => t.pix_copied).length || 0

    return NextResponse.json({
      tracking: data || [],
      stats: {
        totalPixCopied,
      },
    })
  } catch (error) {
    console.error("Error fetching CPF tracking:", error)
    return NextResponse.json({ error: "Failed to fetch tracking data" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (!date) {
      return NextResponse.json({ error: "Date parameter required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Delete all records from specified date
    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)

    const { error } = await supabase
      .from("cpf_tracking")
      .delete()
      .gte("consulted_at", startDate.toISOString())
      .lte("consulted_at", endDate.toISOString())

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting CPF tracking:", error)
    return NextResponse.json({ error: "Failed to delete tracking data" }, { status: 500 })
  }
}
