import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import * as XLSX from "xlsx"

// Generate tracking code in Correios format: 2 letters + 9 digits + BR (e.g., NX123456789BR)
function generateTrackingCode(): string {
  // Common Correios prefixes for international packages
  const prefixes = ['NX', 'RX', 'LX', 'JD', 'NB', 'RB', 'LB', 'CX', 'CP', 'RR']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const numbers = Math.floor(Math.random() * 900000000) + 100000000
  return `${prefix}${numbers}BR`
}

// Smart price detection - detects if value has decimal separator or is in centavos
function parsePrice(value: string | number): number {
  if (typeof value === 'number') {
    // If it's already a number, check if it looks like centavos (no decimal)
    if (Number.isInteger(value) && value > 100) {
      // Likely centavos (e.g., 18900 = R$ 189,00)
      return value / 100
    }
    return value
  }
  
  const strValue = String(value || "0").trim()
  
  // Check if has decimal separator (. or ,)
  const hasDecimalSeparator = /[.,]\d{1,2}$/.test(strValue)
  
  if (hasDecimalSeparator) {
    // Has decimal separator - it's already in reais format (e.g., "189.90" or "189,90")
    const cleaned = strValue.replace(/[^\d.,]/g, "").replace(",", ".")
    return Number.parseFloat(cleaned) || 0
  } else {
    // No decimal separator - treat as centavos (e.g., "18990" = R$ 189,90)
    const cleaned = strValue.replace(/\D/g, "")
    const centavos = Number.parseInt(cleaned, 10) || 0
    return centavos / 100
  }
}

// Extract data from message body format (e.g., "Detalhes do pedido: Produto | CPF: 12345678901 | Endereco: ...")
function extractFromMessageBody(body: string): { cpf: string; produto: string; valor: number; endereco: string } | null {
  if (!body || typeof body !== 'string') return null
  
  // Extract CPF - look for "CPF: XXXXXXXXXXX" pattern (9-11 digits to handle incomplete CPFs)
  const cpfMatch = body.match(/CPF:\s*(\d{9,11})/i)
  let cpf = cpfMatch ? cpfMatch[1] : ""
  
  // Pad CPF to 11 digits if needed
  if (cpf && cpf.length < 11) {
    cpf = cpf.padStart(11, '0')
  }
  
  if (!cpf) return null
  
  // Extract product - look for "Detalhes do pedido: PRODUTO," or "Detalhes do pedido: PRODUTO |" pattern
  const produtoMatch = body.match(/Detalhes do pedido:\s*([^,|]+)/i)
  let produto = produtoMatch ? produtoMatch[1].trim() : ""
  // Clean up emoji at start
  produto = produto.replace(/^🔍\s*/, "").trim()
  
  // Extract value - look for "Valor: R$ XX,XX" or "taxa pendente" pattern
  const valorMatch = body.match(/Valor:\s*R\$\s*([\d.,]+)/i)
  let valor = 0
  if (valorMatch) {
    const valorStr = valorMatch[1].replace(".", "").replace(",", ".")
    valor = parseFloat(valorStr) || 0
  }
  
  // Extract address - look for "📍 Endereço:" or "Endereco:" pattern (with or without accent, with or without space)
  const enderecoMatch = body.match(/📍\s*Endere[çc]o:\s*([^⚠️]+)/i) || 
                        body.match(/Endere[çc]o:\s*([^⚠️|]+)/i) ||
                        body.match(/📍\s*([^⚠️]+)/i)
  let endereco = enderecoMatch ? enderecoMatch[1].trim() : ""
  // Clean up "nan" addresses and trailing dots
  if (endereco.toLowerCase() === "nan" || endereco.toLowerCase() === "nan.") {
    endereco = ""
  }
  endereco = endereco.replace(/\.\s*$/, "").trim()
  
  return { cpf, produto, valor, endereco }
}

// Extract data from REMESSA format
// Pattern: "📦 Item: PRODUTO | CPF: XXXXXXXXXX 📍Endereço cadastrado: ENDERECO"
// Or without CPF: "📦 Item: PRODUTO📍Endereço cadastrado: ENDERECO"
function extractFromRemessaBody(body: string, telefone: string): { cpf: string; produto: string; valor: number; endereco: string } | null {
  if (!body || typeof body !== 'string') return null
  
  // Extract CPF first if present - pattern "| CPF: XXXXXXXXXXX" or "CPF: XXXXXXXXXXX"
  const cpfMatch = body.match(/\|\s*CPF:\s*(\d{11})/i) || body.match(/CPF:\s*(\d{11})/i)
  let cpf = cpfMatch ? cpfMatch[1] : ""
  
  // Extract product - pattern "📦 Item: PRODUTO |" or "📦 Item: PRODUTO📍"
  // Product is between "📦 Item:" and either "|" or "📍"
  const produtoMatch = body.match(/📦\s*Item:\s*([^|📍]+)/i)
  let produto = produtoMatch ? produtoMatch[1].trim() : ""
  
  if (!produto) return null
  
  // Extract address - pattern "📍Endereço cadastrado: ADDRESS" or "📍Endereco cadastrado: ADDRESS"
  const enderecoMatch = body.match(/📍\s*Endere[çc]o\s*cadastrado:\s*([^"]+)/i)
  let endereco = enderecoMatch ? enderecoMatch[1].trim() : ""
  // Clean up trailing quotes and extra spaces
  endereco = endereco.replace(/["']\s*$/, "").trim()
  
  // If no CPF found in body, use telefone as fallback (last 11 digits, padded if needed)
  if (!cpf) {
    cpf = telefone.replace(/\D/g, "")
    if (cpf.length > 11) {
      cpf = cpf.slice(-11)
    } else if (cpf.length < 11) {
      cpf = cpf.padStart(11, '0')
    }
  }
  
  return { cpf, produto, valor: 0, endereco }
}

function detectColumnsFromHeader(header: string[]): { format: string; indices: any } {
  const headerLower = header.map((h) =>
    String(h || "")
      .toLowerCase()
      .trim(),
  )

  console.log("[v0] Header columns:", headerLower)
  
  // Check for REMESSA format - no header, has "📦 Item:" pattern in column 4 (index 3)
  // Format: Nome, Telefone, Msg1, Msg2 (with 📦 Item and 📍Endereço), Msg3
  const remessaColumnIdx = header.findIndex(h => String(h || "").includes("📦 Item:"))
  if (remessaColumnIdx >= 0) {
    console.log("[v0] Detected REMESSA format - 📦 Item pattern found in column", remessaColumnIdx)
    return {
      format: "REMESSA",
      indices: {
        nome: 0,
        telefone: 1,
        msg1: 2,
        remessa: remessaColumnIdx, // This column contains produto and endereco
        msg3: 4,
      },
    }
  }
  
  // Check for message body format (Nome, Telefone, Assunto, Corpo com dados)
  // This format has data embedded in a message body column
  const firstRow = header[0]?.toString() || ""
  const hasMessageFormat = header.length >= 4 && !headerLower.includes("cpf") && !headerLower.includes("nome do lead")
  
  // Check if any column contains "CPF:" which indicates message body format
  const bodyColumnIdx = header.findIndex(h => String(h || "").includes("CPF:"))
  if (bodyColumnIdx >= 0 || hasMessageFormat) {
    console.log("[v0] Detected MESSAGE BODY format - data embedded in text column")
    return {
      format: "MESSAGE_BODY",
      indices: {
        nome: 0,
        telefone: 1,
        assunto: 2,
        corpo: 3, // This column contains CPF, produto, valor, endereco
      },
    }
  }

  // Check for DISPARO/PEDIDO format (tipo_pagamento, total_pedido, loja, kits_do_pedido, produtos_do_pedido, telefone, nome, cpf, email, cep, rua, numero, complemento, bairro, cidade, estado)
  const totalPedidoIdx = headerLower.findIndex((h) => h === "total_pedido" || h.includes("total_pedido"))
  const tipoPagamentoIdx = headerLower.findIndex((h) => h === "tipo_pagamento" || h.includes("tipo_pagamento"))
  const produtosDoPedidoIdx = headerLower.findIndex((h) => h === "produtos_do_pedido" || h.includes("produtos_do_pedido"))
  const kitsDoPedidoIdx = headerLower.findIndex((h) => h === "kits_do_pedido" || h.includes("kits_do_pedido"))
  const lojaIdx = headerLower.findIndex((h) => h === "loja")
  
  if (totalPedidoIdx >= 0 && tipoPagamentoIdx >= 0) {
    console.log("[v0] Detected DISPARO/PEDIDO format (total_pedido, tipo_pagamento, produtos_do_pedido...)")
    return {
      format: "DISPARO",
      indices: {
        tipoPagamento: tipoPagamentoIdx,
        totalPedido: totalPedidoIdx,
        loja: lojaIdx,
        kits: kitsDoPedidoIdx,
        produtos: produtosDoPedidoIdx >= 0 ? produtosDoPedidoIdx : kitsDoPedidoIdx,
        telefone: headerLower.findIndex((h) => h === "telefone"),
        nome: headerLower.findIndex((h) => h === "nome"),
        cpf: headerLower.findIndex((h) => h === "cpf"),
        email: headerLower.findIndex((h) => h === "email"),
        cep: headerLower.findIndex((h) => h === "cep"),
        rua: headerLower.findIndex((h) => h === "rua"),
        numero: headerLower.findIndex((h) => h === "numero" || h === "número"),
        complemento: headerLower.findIndex((h) => h === "complemento"),
        bairro: headerLower.findIndex((h) => h === "bairro"),
        cidade: headerLower.findIndex((h) => h === "cidade"),
        estado: headerLower.findIndex((h) => h === "estado"),
      },
    }
  }

  const dataCriacaoIdx = headerLower.findIndex((h) => h.includes("data_criacao") || h.includes("data criacao"))
  const tituloItemIdx = headerLower.findIndex(
    (h) => h.includes("titulo_item") || h.includes("titulo item") || h === "titulo",
  )
  const precoIdx = headerLower.findIndex((h) => h === "preco" || h === "preço")

  if (dataCriacaoIdx >= 0 || tituloItemIdx >= 0) {
    console.log("[v0] Detected TRANSACAO format (data_criacao, titulo_item, preco...)")
    return {
      format: "TRANSACAO",
      indices: {
        dataCriacao: dataCriacaoIdx >= 0 ? dataCriacaoIdx : -1,
        produto: tituloItemIdx >= 0 ? tituloItemIdx : -1,
        preco: precoIdx >= 0 ? precoIdx : -1,
        nome: headerLower.findIndex((h) => h === "nome"),
        email: headerLower.findIndex((h) => h === "email"),
        cpf: headerLower.findIndex((h) => h === "cpf"),
        telefone: headerLower.findIndex((h) => h === "telefone"),
        cep: headerLower.findIndex((h) => h === "cep"),
        bairro: headerLower.findIndex((h) => h === "bairro"),
        cidade: headerLower.findIndex((h) => h === "cidade"),
        rua: headerLower.findIndex((h) => h === "rua"),
        numero: headerLower.findIndex((h) => h === "numero" || h === "número"),
        complemento: headerLower.findIndex((h) => h === "complemento"),
        estado: headerLower.findIndex((h) => h === "estado"),
      },
    }
  }

  // Existing formats...
  const nomeLeadIdx = headerLower.findIndex((h) => h.includes("nome do lead") || h.includes("nome_do_lead"))
  const nomeProdutoIdx = headerLower.findIndex(
    (h) => h.includes("nome do produto") || h.includes("nome_do_produto") || h === "produto" || h.includes("descricao_produto") || h.includes("descrição_produto") || h.includes("descricao produto"),
  )
  const cpfIdx = headerLower.findIndex((h) => h === "cpf" || h.includes("cpf"))
  const telefoneIdx = headerLower.findIndex((h) => h === "telefone" || h.includes("telefone") || h.includes("phone"))
  const valorIdx = headerLower.findIndex((h) => h === "valor" || h.includes("valor") || h.includes("value"))
  const enderecoCompletoIdx = headerLower.findIndex(
    (h) => h.includes("endereco completo") || h.includes("endereço completo") || h.includes("endereco_completo") || h.includes("endereco_destino") || h.includes("endereço_destino") || h.includes("endereco destino"),
  )
  const cidadeIdx = headerLower.findIndex((h) => h === "cidade" || h.includes("city"))
  const estadoIdx = headerLower.findIndex((h) => h === "estado" || h.includes("state") || h === "uf")
  const bairroIdx = headerLower.findIndex((h) => h === "bairro" || h.includes("neighborhood"))
  const ruaIdx = headerLower.findIndex((h) => h === "rua" || h.includes("street") || h.includes("logradouro"))
  const numeroIdx = headerLower.findIndex((h) => h === "numero" || h === "número" || h.includes("number"))
  const complementoIdx = headerLower.findIndex((h) => h === "complemento" || h.includes("complement"))
  const cepIdx = headerLower.findIndex((h) => h === "cep" || h.includes("zip") || h.includes("postal"))
  // Support DOME as nome column
  const domeIdx = headerLower.findIndex((h) => h === "dome" || h === "nome" || h.includes("nome"))

  // DOME format: DOME, CPF, TELEFONE, CODIGO_RASTREIO, ENDERECO_DESTINO, DESCRICAO_PRODUTO, ENVIO
  const domeFormatIdx = headerLower.findIndex((h) => h === "dome")
  const codigoRastreioIdx = headerLower.findIndex((h) => h.includes("codigo_rastreio") || h.includes("código_rastreio") || h.includes("codigo rastreio"))
  const enderecoDesinoIdx = headerLower.findIndex((h) => h.includes("endereco_destino") || h.includes("endereço_destino") || h.includes("endereco destino"))
  const descricaoProdutoIdx = headerLower.findIndex((h) => h.includes("descricao_produto") || h.includes("descrição_produto") || h.includes("descricao produto"))

  if (domeFormatIdx >= 0 && cpfIdx >= 0) {
    console.log("[v0] Detected DOME format")
    return {
      format: "DOME",
      indices: {
        nome: domeFormatIdx,
        cpf: cpfIdx,
        telefone: telefoneIdx >= 0 ? telefoneIdx : -1,
        rastreio: codigoRastreioIdx >= 0 ? codigoRastreioIdx : -1,
        endereco: enderecoDesinoIdx >= 0 ? enderecoDesinoIdx : enderecoCompletoIdx >= 0 ? enderecoCompletoIdx : -1,
        produto: descricaoProdutoIdx >= 0 ? descricaoProdutoIdx : nomeProdutoIdx >= 0 ? nomeProdutoIdx : -1,
        valor: valorIdx >= 0 ? valorIdx : -1,
      },
    }
  }

  // New format with "Nome do Lead" column
  if (nomeLeadIdx >= 0 && cpfIdx >= 0) {
    console.log("[v0] Detected NEW LEAD format")
    return {
      format: "LEAD",
      indices: {
        nome: nomeLeadIdx,
        produto: nomeProdutoIdx >= 0 ? nomeProdutoIdx : -1,
        telefone: telefoneIdx >= 0 ? telefoneIdx : -1,
        valor: valorIdx >= 0 ? valorIdx : -1,
        cpf: cpfIdx,
        enderecoCompleto: enderecoCompletoIdx >= 0 ? enderecoCompletoIdx : -1,
        cidade: cidadeIdx >= 0 ? cidadeIdx : -1,
        estado: estadoIdx >= 0 ? estadoIdx : -1,
        bairro: bairroIdx >= 0 ? bairroIdx : -1,
        rua: ruaIdx >= 0 ? ruaIdx : -1,
        numero: numeroIdx >= 0 ? numeroIdx : -1,
        complemento: complementoIdx >= 0 ? complementoIdx : -1,
        cep: cepIdx >= 0 ? cepIdx : -1,
      },
    }
  }

  // Check for old format with rastreio
  const rastreioIdx = headerLower.findIndex((h) => h.includes("rastreio") || h.includes("tracking") || h.includes("codigo_rastreio"))
  const taxidIdx = headerLower.findIndex((h) => h.includes("taxid") || h.includes("tax_id"))
  const nomeIdx = headerLower.findIndex((h) => h === "nome" || h.includes("name"))
  const enderecoIdx = headerLower.findIndex((h) => h === "endereco" || h.includes("address") || h.includes("endereco_destino") || h.includes("endereço_destino"))
  const produtoIdx = headerLower.findIndex((h) => h === "produto" || h.includes("product") || h.includes("descricao_produto") || h.includes("descrição_produto"))

  if (rastreioIdx >= 0 && taxidIdx >= 0) {
    console.log("[v0] Detected NEW RASTREIO format")
    return {
      format: "RASTREIO_NEW",
      indices: {
        rastreio: rastreioIdx,
        nome: nomeIdx >= 0 ? nomeIdx : 3,
        cpf: taxidIdx,
        endereco: enderecoIdx >= 0 ? enderecoIdx : 5,
        telefone: telefoneIdx >= 0 ? telefoneIdx : 6,
        valor: valorIdx >= 0 ? valorIdx : 7,
        produto: produtoIdx >= 0 ? produtoIdx : 8,
      },
    }
  }

  // Old 6-column format
  if (header.length === 6) {
    console.log("[v0] Detected OLD 6-column format")
    return {
      format: "OLD",
      indices: {
        nome: 0,
        telefone: 1,
        cpf: 2,
        endereco: 3,
        produto: 4,
        rastreio: 5,
      },
    }
  }

  // Auto-detect fallback
  console.log("[v0] Using AUTO-DETECT fallback")
  return {
    format: "AUTO",
    indices: {
      nome: domeIdx >= 0 ? domeIdx : (nomeIdx >= 0 ? nomeIdx : 0),
      telefone: telefoneIdx >= 0 ? telefoneIdx : 1,
      cpf: cpfIdx >= 0 ? cpfIdx : 2,
      endereco: enderecoIdx >= 0 ? enderecoIdx : (enderecoCompletoIdx >= 0 ? enderecoCompletoIdx : 3),
      produto: produtoIdx >= 0 ? produtoIdx : (nomeProdutoIdx >= 0 ? nomeProdutoIdx : 4),
      rastreio: rastreioIdx >= 0 ? rastreioIdx : -1,
      valor: valorIdx >= 0 ? valorIdx : -1,
    },
  }
}

function parseScientificNotation(value: string): string {
  const trimmed = String(value || "").trim()

  if (/[eE]/.test(trimmed)) {
    try {
      const num = Number.parseFloat(trimmed)
      if (!isNaN(num) && isFinite(num)) {
        return num.toFixed(0)
      }
    } catch (e) {
      console.error("[v0] Error parsing scientific notation:", trimmed, e)
    }
  }

  return trimmed
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const listaId = formData.get("lista_id") as string | null

    if (!file) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 400 })
    }
    
    console.log("[v0] Upload with lista_id:", listaId)

    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, {
      type: "array",
      codepage: 65001,
      cellText: false,
      cellDates: false,
    })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
      header: 1,
      defval: "",
      raw: false,
      dateNF: "yyyy-mm-dd",
    })

    if (jsonData.length < 2) {
      return NextResponse.json({ error: "Planilha vazia ou inválida" }, { status: 400 })
    }

    const header = jsonData[0] as string[]
    const headerStr = header.join(",").toLowerCase()

    // Detect if first row is a header or if it's message body format
    const hasHeader =
      headerStr.includes("nome") ||
      headerStr.includes("cpf") ||
      headerStr.includes("lead") ||
      headerStr.includes("produto") ||
      headerStr.includes("titulo") ||
      headerStr.includes("preco")
    
    // Check if first row contains actual data (message body format has data in first row)
    const firstRowHasData = header.some(cell => String(cell || "").includes("CPF:"))
    const startRow = (hasHeader && !firstRowHasData) ? 1 : 0

    console.log("[v0] Has header:", hasHeader)
    console.log("[v0] Header string:", headerStr)
    console.log("[v0] Processing file with", jsonData.length - startRow, "total rows")

    const { format, indices } = detectColumnsFromHeader(header)

    console.log("[v0] Detected format:", format)
    console.log("[v0] Column indices:", indices)

    const supabase = createAdminClient()
    const packagesMap = new Map()
    let skippedRows = 0
    const skipReasons: Record<string, number> = {}
    const rastreioCount = new Map<string, number>()

    for (let i = startRow; i < jsonData.length; i++) {
      const row = jsonData[i] as string[]

      if (!row || row.length < 3) {
        skippedRows++
        skipReasons["Linha vazia ou incompleta"] = (skipReasons["Linha vazia ou incompleta"] || 0) + 1
        continue
      }

      let nome = ""
      let telefone = ""
      let cpfRaw = ""
      let endereco = ""
      let produto = ""
      let valor = 0
      let codigoRastreio = ""

      if (format === "DOME") {
        nome = String(row[indices.nome] || "").trim()
        const telefoneRaw = parseScientificNotation(row[indices.telefone] || "")
        telefone = telefoneRaw.replace(/\D/g, "").trim()
        cpfRaw = parseScientificNotation(row[indices.cpf] || "")
          .replace(/\D/g, "")
          .trim()
        endereco = indices.endereco >= 0 ? String(row[indices.endereco] || "").trim() : ""
        produto = indices.produto >= 0 ? String(row[indices.produto] || "").trim() : ""
        if (indices.valor >= 0 && row[indices.valor]) {
          valor = parsePrice(row[indices.valor])
        }
        // Use existing tracking code from file, or generate one
        if (indices.rastreio >= 0 && row[indices.rastreio]) {
          const rastreioRaw = parseScientificNotation(row[indices.rastreio] || "").trim()
          const count = rastreioCount.get(rastreioRaw) || 0
          rastreioCount.set(rastreioRaw, count + 1)
          codigoRastreio = count > 0 ? `${rastreioRaw}-${count.toString().padStart(3, "0")}` : rastreioRaw
        } else {
          codigoRastreio = generateTrackingCode()
        }
      } else if (format === "REMESSA") {
        // REMESSA format: Nome, Telefone, Msg1, Msg2 (with 📦 Item and 📍Endereço), Msg3
        // No CPF in this format - we use telefone as identifier
        nome = String(row[indices.nome] || "").trim()
        const telefoneRaw = parseScientificNotation(row[indices.telefone] || "")
        telefone = telefoneRaw.replace(/\D/g, "").trim()
        
        // Extract produto and endereco from the remessa column
        const remessaText = String(row[indices.remessa] || "")
        const extracted = extractFromRemessaBody(remessaText, telefone)
        
        if (extracted) {
          cpfRaw = extracted.cpf // This is actually the telefone formatted as CPF
          produto = extracted.produto
          valor = extracted.valor
          endereco = extracted.endereco
        } else {
          // Skip if we can't extract data
          skippedRows++
          skipReasons["Não foi possível extrair dados da mensagem de remessa"] = (skipReasons["Não foi possível extrair dados da mensagem de remessa"] || 0) + 1
          continue
        }
        
        codigoRastreio = generateTrackingCode()
      } else if (format === "MESSAGE_BODY") {
        // Extract data from message body format
        nome = String(row[indices.nome] || "").trim()
        const telefoneRaw = parseScientificNotation(row[indices.telefone] || "")
        telefone = telefoneRaw.replace(/\D/g, "").trim()
        
        // Extract CPF, produto, valor, endereco from the message body column
        const corpoText = String(row[indices.corpo] || "")
        const extracted = extractFromMessageBody(corpoText)
        
        if (extracted) {
          cpfRaw = extracted.cpf
          produto = extracted.produto
          valor = extracted.valor
          endereco = extracted.endereco
        } else {
          // Skip if we can't extract CPF from body
          skippedRows++
          skipReasons["Não foi possível extrair CPF do corpo da mensagem"] = (skipReasons["Não foi possível extrair CPF do corpo da mensagem"] || 0) + 1
          continue
        }
        
        codigoRastreio = generateTrackingCode()
      } else if (format === "DISPARO") {
        // DISPARO format: tipo_pagamento, total_pedido, loja, kits_do_pedido, produtos_do_pedido, telefone, nome, cpf, email, cep, rua, numero, complemento, bairro, cidade, estado
        nome = String(row[indices.nome] || "").trim()
        
        const telefoneRaw = parseScientificNotation(row[indices.telefone] || "")
        telefone = telefoneRaw.replace(/\D/g, "").trim()
        
        cpfRaw = parseScientificNotation(row[indices.cpf] || "")
          .replace(/\D/g, "")
          .trim()
        
        // Get product from produtos_do_pedido or kits_do_pedido
        produto = String(row[indices.produtos] || row[indices.kits] || "").trim()
        
        // Parse price - format is "246,36" (Brazilian format with comma)
        if (indices.totalPedido >= 0 && row[indices.totalPedido]) {
          valor = parsePrice(row[indices.totalPedido])
        }
        
        // Build full address from parts
        const addressParts = []
        if (indices.rua >= 0 && row[indices.rua]) {
          let rua = String(row[indices.rua]).trim()
          // Add number to street if available
          if (indices.numero >= 0 && row[indices.numero]) {
            const num = String(row[indices.numero]).trim()
            if (num && num !== "-") {
              rua += `, ${num}`
            }
          }
          addressParts.push(rua)
        }
        if (indices.complemento >= 0 && row[indices.complemento]) {
          const comp = String(row[indices.complemento]).trim()
          if (comp && comp !== "-") {
            addressParts.push(comp)
          }
        }
        if (indices.bairro >= 0 && row[indices.bairro]) addressParts.push(String(row[indices.bairro]).trim())
        if (indices.cidade >= 0 && row[indices.cidade]) addressParts.push(String(row[indices.cidade]).trim())
        if (indices.estado >= 0 && row[indices.estado]) addressParts.push(String(row[indices.estado]).trim())
        if (indices.cep >= 0 && row[indices.cep]) {
          const cep = String(row[indices.cep]).trim().replace(/\D/g, "")
          if (cep) addressParts.push(`CEP: ${cep}`)
        }
        endereco = addressParts.filter((p) => p).join(", ")
        
        codigoRastreio = generateTrackingCode()
      } else if (format === "TRANSACAO") {
        nome = String(row[indices.nome] || "").trim()

        const telefoneRaw = parseScientificNotation(row[indices.telefone] || "")
        telefone = telefoneRaw.replace(/\D/g, "").trim()

        cpfRaw = parseScientificNotation(row[indices.cpf] || "")
          .replace(/\D/g, "")
          .trim()

        produto = String(row[indices.produto] || "").trim()

        // Build address from parts
        const addressParts = []
        if (indices.rua >= 0 && row[indices.rua]) addressParts.push(row[indices.rua])
        if (indices.numero >= 0 && row[indices.numero]) addressParts.push(row[indices.numero])
        if (indices.complemento >= 0 && row[indices.complemento]) addressParts.push(row[indices.complemento])
        if (indices.bairro >= 0 && row[indices.bairro]) addressParts.push(row[indices.bairro])
        if (indices.cidade >= 0 && row[indices.cidade]) addressParts.push(row[indices.cidade])
        if (indices.estado >= 0 && row[indices.estado]) addressParts.push(row[indices.estado])
        if (indices.cep >= 0 && row[indices.cep]) addressParts.push(`CEP: ${row[indices.cep]}`)
        endereco = addressParts.filter((p) => p).join(", ")

        // Smart price detection - auto-detects decimal vs centavos
        if (indices.preco >= 0 && row[indices.preco]) {
          valor = parsePrice(row[indices.preco])
        }

        codigoRastreio = generateTrackingCode()
      } else if (format === "LEAD") {
        nome = String(row[indices.nome] || "").trim()
        const telefoneRaw = parseScientificNotation(row[indices.telefone] || "")
        telefone = telefoneRaw.replace(/\D/g, "").trim()
        cpfRaw = parseScientificNotation(row[indices.cpf] || "")
          .replace(/\D/g, "")
          .trim()

        if (indices.enderecoCompleto >= 0 && row[indices.enderecoCompleto]) {
          endereco = String(row[indices.enderecoCompleto] || "").trim()
        } else {
          const parts = []
          if (indices.rua >= 0 && row[indices.rua]) parts.push(row[indices.rua])
          if (indices.numero >= 0 && row[indices.numero]) parts.push(row[indices.numero])
          if (indices.complemento >= 0 && row[indices.complemento]) parts.push(row[indices.complemento])
          if (indices.bairro >= 0 && row[indices.bairro]) parts.push(row[indices.bairro])
          if (indices.cidade >= 0 && row[indices.cidade]) parts.push(row[indices.cidade])
          if (indices.estado >= 0 && row[indices.estado]) parts.push(row[indices.estado])
          if (indices.cep >= 0 && row[indices.cep]) parts.push(`CEP: ${row[indices.cep]}`)
          endereco = parts.filter((p) => p).join(", ")
        }

        produto = indices.produto >= 0 ? String(row[indices.produto] || "").trim() : ""

        if (indices.valor >= 0 && row[indices.valor]) {
          valor = parsePrice(row[indices.valor])
        }

        codigoRastreio = generateTrackingCode()
      } else {
        // Original logic for other formats
        nome = String(row[indices.nome] || "").trim()
        const telefoneRaw = parseScientificNotation(row[indices.telefone] || "")
        telefone = telefoneRaw.replace(/\D/g, "").trim()
        cpfRaw = parseScientificNotation(row[indices.cpf] || "")
          .replace(/\D/g, "")
          .trim()

        if (indices.endereco >= 0) {
          endereco = String(row[indices.endereco] || "").trim()
        }

        produto = indices.produto >= 0 ? String(row[indices.produto] || "").trim() : ""

        if (format === "LEAD" || indices.rastreio < 0) {
          codigoRastreio = generateTrackingCode()
        } else {
          const rastreioRaw = parseScientificNotation(row[indices.rastreio] || "").trim()
          const count = rastreioCount.get(rastreioRaw) || 0
          rastreioCount.set(rastreioRaw, count + 1)
          codigoRastreio = count > 0 ? `${rastreioRaw}-${count.toString().padStart(3, "0")}` : rastreioRaw
        }

        if (indices.valor >= 0 && row[indices.valor]) {
          valor = parsePrice(row[indices.valor])
        }
      }

      // Validate required fields
      if (!nome) {
        skippedRows++
        skipReasons["Nome vazio"] = (skipReasons["Nome vazio"] || 0) + 1
        continue
      }

      if (!cpfRaw) {
        skippedRows++
        skipReasons["CPF/CNPJ vazio"] = (skipReasons["CPF/CNPJ vazio"] || 0) + 1
        continue
      }

      // Pad CPF with zeros if needed
      if (cpfRaw.length < 11 && cpfRaw.length >= 9) {
        cpfRaw = cpfRaw.padStart(11, "0")
      }

      if (cpfRaw.length >= 12 && cpfRaw.length <= 13) {
        cpfRaw = cpfRaw.padStart(14, "0")
      }

      if (cpfRaw.length !== 11 && cpfRaw.length !== 14) {
        skippedRows++
        skipReasons[`CPF/CNPJ inválido (${cpfRaw.length} dígitos)`] =
          (skipReasons[`CPF/CNPJ inválido (${cpfRaw.length} dígitos)`] || 0) + 1
        continue
      }

      const packageData: any = {
        nome,
        telefone: telefone || "",
        cpf: cpfRaw,
        endereco: endereco || "",
        produto: produto || "",
        codigo_rastreio: codigoRastreio,
        remessa: codigoRastreio,
        valor,
        status: "Taxado",
        pedido_postado: true,
        pedido_em_rota: true,
        pedido_taxado: true,
        pedido_entregue: false,
      }
      
      // Add lista_id if provided (UUID string)
      if (listaId) {
        packageData.lista_id = listaId
      }

      // Use CPF as unique key to avoid duplicates
      packagesMap.set(cpfRaw, packageData)
    }

    const packages = Array.from(packagesMap.values())
    console.log("[v0] Valid unique packages:", packages.length)
    console.log("[v0] Skipped rows:", skippedRows)
    console.log("[v0] Skip reasons:", skipReasons)

    if (packages.length === 0) {
      return NextResponse.json(
        {
          error: "Nenhum pacote válido encontrado. Verifique se o CSV contém as colunas corretas (Nome, CPF, etc).",
        },
        { status: 400 },
      )
    }

    const batchSize = 100
    let totalInserted = 0
    let totalFailed = 0

    for (let i = 0; i < packages.length; i += batchSize) {
      const batch = packages.slice(i, i + batchSize)
      console.log(`[v0] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(packages.length / batchSize)}`)

      const { data, error } = await supabase
        .from("packages")
        .upsert(batch, {
          onConflict: "codigo_rastreio",
          ignoreDuplicates: false,
        })
        .select()

      if (error) {
        console.error("[v0] Batch error:", error.message, "- Trying individual inserts")

        for (const pkg of batch) {
          const { error: individualError } = await supabase.from("packages").upsert(pkg, {
            onConflict: "codigo_rastreio",
            ignoreDuplicates: false,
          })

          if (individualError) {
            console.error("[v0] Failed to insert:", pkg.codigo_rastreio, individualError.message)
            totalFailed++
          } else {
            totalInserted++
          }
        }
      } else {
        totalInserted += batch.length
      }

      if (i + batchSize < packages.length) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    console.log("[v0] Upload complete - Inserted/Updated:", totalInserted, "| Failed:", totalFailed)

    return NextResponse.json({
      success: true,
      count: totalInserted,
      failed: totalFailed,
      skipped: skippedRows,
      total: jsonData.length - startRow,
    })
  } catch (error: any) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json(
      {
        error: `Erro ao processar arquivo: ${error.message || "Formato inválido"}`,
      },
      { status: 500 },
    )
  }
}
