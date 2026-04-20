import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const HORSEPAY_AUTH_URL = "https://api.horsepay.io/auth/token"
const HORSEPAY_ORDER_URL = "https://api.horsepay.io/api/orders/deposit"

async function getHorsePayToken(clientKey: string, clientSecret: string): Promise<string | null> {
  try {
    const res = await fetch(HORSEPAY_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_key: clientKey, client_secret: clientSecret }),
    })
    const data = await res.json()
    return data.access_token || null
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get("transactionId")

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get gateway credentials
    const { data: gateway } = await supabase
      .from("gateway_settings")
      .select("*")
      .eq("is_active", true)
      .single()

    const clientKey = gateway?.secret_key || ""
    const clientSecret = gateway?.company_id || ""

    if (!clientKey || !clientSecret) {
      return NextResponse.json({ pixKey: null, transactionId, status: "unknown" })
    }

    const token = await getHorsePayToken(clientKey, clientSecret)
    if (!token) {
      return NextResponse.json({ pixKey: null, transactionId, status: "unknown" })
    }

    console.log("[HorsePay] Checking status for transaction:", transactionId)

    const response = await fetch(`${HORSEPAY_ORDER_URL}/${transactionId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    const text = await response.text()
    console.log("[HorsePay] Status response:", text.substring(0, 300))

    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      return NextResponse.json({ pixKey: null, transactionId })
    }

    // HorsePay deposit status: "pending" or "paid"
    const status = data.status || "pending"
    const isPaid = status === "paid"

    if (isPaid) {
      // Update payment status in DB
      try {
        await supabase.from("cpf_tracking").update({
          payment_status: "paid",
          paid_at: new Date().toISOString(),
        }).eq("payment_id", transactionId)
      } catch {}
    }

    return NextResponse.json({
      pixKey: null, // HorsePay doesn't return PIX code on status check
      transactionId,
      status: isPaid ? "paid" : "pending",
    })

  } catch (error) {
    console.error("[HorsePay] Get status error:", error)
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 })
  }
}
