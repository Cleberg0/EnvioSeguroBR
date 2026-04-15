import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// MasterFy API configuration
const MASTERFY_API_URL = "https://api.MasterFy.com.br/api/public/v1"
const MASTERFY_API_TOKEN = "O36ReLi1zBnd5Y4aAPMHzDgIUKCqQhfhr4OajAIjbjAL0yeA37kqN8QthZLu"
const MASTERFY_ACCOUNT_HASH = "opeluvjf6e"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { amount, customerCPF, customerName, cpf: bodyCpf, nome } = body

    const cpf = (bodyCpf || customerCPF || "").toString().replace(/\D/g, "")
    const name = nome || customerName || "Cliente"

    if (!cpf || cpf.length !== 11) {
      return NextResponse.json({ error: "CPF invalido" }, { status: 400 })
    }

    // Get tax value from settings if amount not provided
    let amountInCents = amount
    if (!amountInCents) {
      try {
        const supabase = createAdminClient()
        const { data: settings } = await supabase
          .from("site_settings")
          .select("tax_value")
          .single()
        amountInCents = settings?.tax_value || 5349
      } catch {
        amountInCents = 5349
      }
    }
    amountInCents = Math.round(Number(amountInCents))

    console.log("[MasterFy] Creating payment for CPF:", cpf, "Amount:", amountInCents, "Name:", name)

    // Build MasterFy payload exactly as their docs specify
    const payload = {
      api_token: MASTERFY_API_TOKEN,
      amount: amountInCents,
      offer_hash: MASTERFY_ACCOUNT_HASH,
      payment_method: "pix",
      customer: {
        name: String(name).substring(0, 50),
        email: `cliente${cpf}@email.com`,
        phone_number: "11999999999",
        document: cpf,
        street_name: "Rua Principal",
        number: "100",
        complement: "",
        neighborhood: "Centro",
        city: "Sao Paulo",
        state: "SP",
        zip_code: "01310100"
      },
      cart: [
        {
          product_hash: MASTERFY_ACCOUNT_HASH,
          title: "AHL1",
          cover: null,
          price: amountInCents,
          quantity: 1,
          operation_type: 1,
          tangible: false
        }
      ],
      expire_in_days: 1,
      transaction_origin: "api",
      tracking: {
        src: "",
        utm_source: "",
        utm_medium: "",
        utm_campaign: "",
        utm_term: "",
        utm_content: ""
      },
      postback_url: "https://www.oficialjadlogexpress.com/webhook/masterfy"
    }

    console.log("[MasterFy] Payload:", JSON.stringify(payload).substring(0, 500))

    const response = await fetch(`${MASTERFY_API_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()
    console.log("[MasterFy] Response status:", response.status)
    console.log("[MasterFy] Response:", responseText.substring(0, 800))

    let data: any
    try {
      data = JSON.parse(responseText)
    } catch {
      console.error("[MasterFy] Failed to parse response:", responseText.substring(0, 200))
      return NextResponse.json({ error: "Erro ao processar resposta" }, { status: 500 })
    }

    if (!response.ok) {
      console.error("[MasterFy] API Error:", JSON.stringify(data))
      return NextResponse.json(
        { error: data.message || data.error || "Erro no gateway" },
        { status: response.status }
      )
    }

    // Extract transaction ID
    const transactionId = data.transaction_hash || data.hash || data.id || data.transactionId || data.transaction_id

    // Extract PIX code - check all possible field locations
    let pixCode = null

    // MasterFy specific fields
    if (data.pix?.pix_qr_code) pixCode = data.pix.pix_qr_code
    else if (data.pix?.qrcode) pixCode = data.pix.qrcode
    else if (data.pix?.qr_code) pixCode = data.pix.qr_code
    else if (data.pix?.brcode) pixCode = data.pix.brcode
    else if (data.pix?.emv) pixCode = data.pix.emv
    else if (data.pix?.copy_paste) pixCode = data.pix.copy_paste
    else if (data.pix?.code) pixCode = data.pix.code
    else if (data.pix?.qrCode) pixCode = data.pix.qrCode
    else if (data.pix?.copyPaste) pixCode = data.pix.copyPaste
    // Direct fields
    else if (data.qrcode) pixCode = data.qrcode
    else if (data.qr_code) pixCode = data.qr_code
    else if (data.qrCode) pixCode = data.qrCode
    else if (data.pixCode) pixCode = data.pixCode
    else if (data.pix_code) pixCode = data.pix_code
    else if (data.brcode) pixCode = data.brcode
    else if (data.emv) pixCode = data.emv
    else if (data.copy_paste) pixCode = data.copy_paste
    else if (data.copyPaste) pixCode = data.copyPaste
    // Nested
    else if (data.payment?.pix?.qrcode) pixCode = data.payment.pix.qrcode
    else if (data.payment?.qrCode) pixCode = data.payment.qrCode

    // QR code image
    let qrCodeImage = data.pix?.qr_code_image || data.pix?.qrCodeImage || 
                      data.qr_code_image || data.qrCodeImage || null

    console.log("[MasterFy] Transaction ID:", transactionId)
    console.log("[MasterFy] PIX Code found:", pixCode ? "Yes (" + String(pixCode).substring(0, 50) + "...)" : "No")
    console.log("[MasterFy] Full response keys:", Object.keys(data).join(", "))
    if (data.pix) console.log("[MasterFy] PIX object keys:", Object.keys(data.pix).join(", "))

    // Update tracking in database
    if (transactionId) {
      try {
        const supabase = createAdminClient()
        await supabase.from("cpf_tracking").update({
          payment_id: String(transactionId),
          payment_status: "pending",
        }).eq("cpf", cpf)
      } catch (dbError) {
        console.log("[MasterFy] DB update skipped")
      }
    }

    if (pixCode) {
      return NextResponse.json({
        qrCode: pixCode,
        pixKey: pixCode,
        qrCodeImage: qrCodeImage,
        transactionId: transactionId,
        amount: amountInCents,
      })
    }

    // If no PIX code in response, return transaction ID for polling
    return NextResponse.json({
      transactionId: transactionId,
      amount: amountInCents,
      status: "processing",
      rawResponse: data,
    })

  } catch (error: any) {
    console.error("[MasterFy] Error:", error)
    return NextResponse.json({ error: "Erro interno", details: error.message }, { status: 500 })
  }
}
