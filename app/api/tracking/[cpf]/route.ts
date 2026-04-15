import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ cpf: string }> }) {
  try {
    const { cpf } = await params

    if (!cpf) {
      return NextResponse.json({ error: "CPF não fornecido" }, { status: 400 })
    }

    const supabase = await createClient()

    // Remove formatting from CPF
    const cleanCPF = cpf.replace(/\D/g, "")
    console.log("[v0] Searching for CPF:", cleanCPF)

    // Search for packages with this CPF
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .eq("cpf", cleanCPF)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Pacote não encontrado" }, { status: 404 })
    }
    
    console.log("[v0] Found package for:", data.nome)

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching package:", error)
    return NextResponse.json({ error: "Erro ao buscar pacote" }, { status: 500 })
  }
}
