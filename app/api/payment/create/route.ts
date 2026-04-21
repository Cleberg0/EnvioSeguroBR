import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const HORSEPAY_AUTH_URL = "https://api.horsepay.io/auth/token"
const HORSEPAY_ORDER_URL = "https://api.horsepay.io/transaction/neworder"

async function getHorsePayToken(clientKey: string, clientSecret: string): Promise<string | null> {
  try {
    const res = await fetch(HORSEPAY_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_key: clientKey, client_secret: clientSecret }),
    })
    const data = await res.json()
    return data.access_token || null
  } catch (err) {
    console.error("[HorsePay] Auth error:", err)
    return null
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { amount, customerCPF, customerName, cpf: bodyCpf, nome } = body

    const cpf = (bodyCpf || customerCPF || "").toString().replace(/\D/g, "")
    const name = nome || customerName || "Cliente"

    if (!cpf || cpf.length !== 11) {
      return NextResponse.json({ error: "CPF invalido" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get tax value if amount not provided
    let amountInCents = amount
    if (!amountInCents) {
      try {
        const { data: settings } = await supabase
          .from("company_settings")
          .select("tax_value")
          .single()
        amountInCents = settings?.tax_value || 5349
      } catch {
        amountInCents = 5349
      }
    }
    amountInCents = Math.round(Number(amountInCents))
    const amountInReais = amountInCents / 100

    // Get gateway credentials from DB
    const { data: gateway } = await supabase
      .from("gateway_settings")
      .select("*")
      .eq("is_active", true)
      .single()

    const clientKey = gateway?.secret_key || ""
    const clientSecret = gateway?.company_id || ""

    if (!clientKey || !clientSecret) {
      console.error("[HorsePay] Missing credentials in gateway_settings")
      return NextResponse.json({ error: "Gateway não configurado" }, { status: 500 })
    }

    // Authenticate
    const token = await getHorsePayToken(clientKey, clientSecret)
    if (!token) {
      return NextResponse.json({ error: "Falha na autenticação com gateway" }, { status: 500 })
    }

    console.log("[HorsePay] Creating payment for CPF:", cpf, "Amount:", amountInReais, "Name:", name)

    const payload = {
      payer_name: String(name).substring(0, 100),
      amount: amountInReais,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.VERCEL_URL}` || "https://enviosegurobr.vercel.app"}/api/webhooks/horsepay`,
      client_reference_id: cpf,
      phone: "",
    }

    const response = await fetch(HORSEPAY_ORDER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()
    console.log("[HorsePay] Response status:", response.status)
    console.log("[HorsePay] Response:", responseText.substring(0, 500))

    let data: any
    try {
      data = JSON.parse(responseText)
    } catch {
      return NextResponse.json({ error: "Erro ao processar resposta do gateway" }, { status: 500 })
    }

    if (!response.ok) {
      console.error("[HorsePay] API Error:", JSON.stringify(data))
      return NextResponse.json(
        { error: data.message || data.error || "Erro no gateway" },
        { status: response.status }
      )
    }

    // HorsePay returns: copy_past, external_id, payer_name, payment (base64 QR image), status
    const pixCode = data.copy_past || null
    const transactionId = String(data.external_id || "")
    const qrCodeImage = data.payment || null // base64 image

    console.log("[HorsePay] Transaction ID:", transactionId)
    console.log("[HorsePay] PIX Code found:", pixCode ? "Yes" : "No")

    // Update tracking in database
    if (transactionId) {
      try {
        await supabase.from("cpf_tracking").update({
          payment_id: transactionId,
          payment_status: "pending",
        }).eq("cpf", cpf)
      } catch (dbError) {
        console.log("[HorsePay] DB update skipped")
      }
    }

    if (pixCode) {
      return NextResponse.json({
        qrCode: pixCode,
        pixKey: pixCode,
        qrCodeImage: qrCodeImage,
        transactionId,
        amount: amountInCents,
      })
    }

    return NextResponse.json({
      transactionId,
      amount: amountInCents,
      status: "processing",
    })

  } catch (error: any) {
    console.error("[HorsePay] Error:", error)
    return NextResponse.json({ error: "Erro interno", details: error.message }, { status: 500 })
  }
}
