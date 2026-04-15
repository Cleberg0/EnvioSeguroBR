import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = createAdminClient()
    
    // Get all lists with stats
    const { data: lists, error } = await supabase
      .from("lists")
      .select("*")
      .order("created_at", { ascending: false })
    
    if (error) throw error
    
    // For each list, get stats
    const listsWithStats = await Promise.all(
      (lists || []).map(async (list) => {
        // Count packages in this list
        const { count: totalLeads } = await supabase
          .from("packages")
          .select("*", { count: "exact", head: true })
          .eq("lista_id", list.id)
        
        // Count CPF tracking for this list
        const { count: cpfsPuxados } = await supabase
          .from("cpf_tracking")
          .select("*", { count: "exact", head: true })
          .eq("lista_id", list.id)
        
        // Count PIX copied for this list
        const { count: pixCopiados } = await supabase
          .from("cpf_tracking")
          .select("*", { count: "exact", head: true })
          .eq("lista_id", list.id)
          .eq("pix_copied", true)
        
        return {
          ...list,
          total_leads: totalLeads || 0,
          cpfs_puxados: cpfsPuxados || 0,
          pix_copiados: pixCopiados || 0,
        }
      })
    )
    
    return NextResponse.json({ lists: listsWithStats })
  } catch (error: any) {
    console.error("Error fetching lists:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()
    
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nome da lista é obrigatório" }, { status: 400 })
    }
    
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from("lists")
      .insert({ name: name.trim() })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ list: data })
  } catch (error: any) {
    console.error("Error creating list:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ error: "ID da lista é obrigatório" }, { status: 400 })
    }
    
    const supabase = createAdminClient()
    
    // Delete all cpf_tracking records associated with this list
    await supabase
      .from("cpf_tracking")
      .delete()
      .eq("lista_id", id)
    
    // Delete all packages associated with this list
    await supabase
      .from("packages")
      .delete()
      .eq("lista_id", id)
    
    // Then delete the list
    const { error } = await supabase
      .from("lists")
      .delete()
      .eq("id", id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting list:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
