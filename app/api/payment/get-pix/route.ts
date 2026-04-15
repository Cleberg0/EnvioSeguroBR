import { NextResponse } from "next/server"

// MasterFy API configuration
const MASTERFY_API_URL = "https://api.MasterFy.com.br/api/public/v1"
const MASTERFY_API_TOKEN = "O36ReLi1zBnd5Y4aAPMHzDgIUKCqQhfhr4OajAIjbjAL0yeA37kqN8QthZLu"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get("transactionId")

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID required" }, { status: 400 })
    }

    console.log("[MasterFy] Fetching transaction:", transactionId)

    const response = await fetch(`${MASTERFY_API_URL}/transactions/${transactionId}?api_token=${MASTERFY_API_TOKEN}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    })

    const text = await response.text()
    console.log("[MasterFy] Get response:", text.substring(0, 500))

    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      return NextResponse.json({ pixKey: null, transactionId })
    }

    // Extract PIX code - MasterFy uses pix.pix_qr_code
    let pixCode = data.pix?.pix_qr_code || data.pix?.qrcode || data.pix?.qr_code || data.pix?.brcode || 
                  data.pix?.emv || data.pix?.copy_paste || data.pix?.code ||
                  data.pix?.qrCode || data.pix?.copyPaste ||
                  data.qrcode || data.qr_code || data.qrCode || data.pixCode ||
                  data.brcode || data.emv || data.copy_paste || data.copyPaste ||
                  data.payment?.pix?.qrcode || data.payment?.qrCode || null

    let qrCodeImage = data.pix?.qr_code_image || data.pix?.qrCodeImage || 
                      data.qr_code_image || data.qrCodeImage || null

    const status = data.status || data.payment_status

    if (pixCode) {
      console.log("[MasterFy] Found PIX code for transaction:", transactionId)
      return NextResponse.json({
        pixKey: pixCode,
        qrCode: pixCode,
        qrCodeImage: qrCodeImage,
        transactionId,
        status: status,
      })
    }

    console.log("[MasterFy] No PIX code found yet, status:", status)
    return NextResponse.json({
      pixKey: null,
      transactionId,
      status: status,
      rawResponse: data,
    })
  } catch (error) {
    console.error("[MasterFy] Error:", error)
    return NextResponse.json({ error: "Failed to fetch PIX" }, { status: 500 })
  }
}
