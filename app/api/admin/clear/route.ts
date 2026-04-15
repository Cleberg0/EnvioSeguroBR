import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function DELETE() {
  try {
    // Delete all packages from database
    const { error } = await supabase.from("packages").delete().neq("id", "00000000-0000-0000-0000-000000000000")

    if (error) {
      console.error("[v0] Error clearing database:", error)
      throw error
    }

    return NextResponse.json({ success: true, message: "Banco de dados limpo com sucesso" })
  } catch (error) {
    console.error("[v0] Error in clear route:", error)
    return NextResponse.json({ error: "Erro ao limpar banco de dados" }, { status: 500 })
  }
}
