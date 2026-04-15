import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    console.log("[Webhook PagueX] Received:", JSON.stringify(payload))
    
    const supabase = createAdminClient()
    
    // Log the webhook
    await supabase.from("webhook_logs").insert({
      provider: "paguex",
      event_type: payload.event || payload.status || "unknown",
      transaction_id: payload.id?.toString() || payload.transactionId?.toString() || null,
      cpf: payload.customer?.document?.number || payload.cpf || null,
      payload: payload,
    })
    
    // Check if payment is approved/paid
    const status = payload.status?.toLowerCase() || ""
    const isPaid = status === "paid" || status === "approved" || status === "completed" || status === "confirmed"
    
    if (isPaid) {
      console.log("[Webhook PagueX] Payment confirmed!")
      
      // Extract CPF from payload
      const cpf = payload.customer?.document?.number || payload.cpf || null
      const transactionId = payload.id?.toString() || payload.transactionId?.toString()
      const amount = payload.amount || payload.value || 0
      
      if (cpf) {
        // Update cpf_tracking to mark as paid
        const { data: trackingData, error: trackingError } = await supabase
          .from("cpf_tracking")
          .update({
            payment_status: "paid",
            payment_id: transactionId,
            paid_at: new Date().toISOString(),
            payment_confirmed_at: new Date().toISOString(),
          })
          .eq("cpf", cpf.replace(/\D/g, ""))
          .select()
        
        if (trackingError) {
          console.error("[Webhook PagueX] Error updating tracking:", trackingError)
        } else {
          console.log("[Webhook PagueX] Updated tracking for CPF:", cpf)
          
          // If tracking has lista_id, update the list's paid count
          if (trackingData && trackingData.length > 0 && trackingData[0].lista_id) {
            const listaId = trackingData[0].lista_id
            
            // Get current paid count
            const { data: listData } = await supabase
              .from("lists")
              .select("total_paid")
              .eq("id", listaId)
              .single()
            
            const currentPaid = listData?.total_paid || 0
            
            // Increment paid count
            await supabase
              .from("lists")
              .update({ total_paid: currentPaid + 1 })
              .eq("id", listaId)
            
            console.log("[Webhook PagueX] Incremented paid count for list:", listaId)
          }
        }
      } else if (transactionId) {
        // Try to find by transaction_id in cpf_tracking
        const { data: trackingData, error: trackingError } = await supabase
          .from("cpf_tracking")
          .update({
            payment_status: "paid",
            paid_at: new Date().toISOString(),
            payment_confirmed_at: new Date().toISOString(),
          })
          .eq("payment_id", transactionId)
          .select()
        
        if (trackingData && trackingData.length > 0 && trackingData[0].lista_id) {
          const listaId = trackingData[0].lista_id
          const { data: listData } = await supabase
            .from("lists")
            .select("total_paid")
            .eq("id", listaId)
            .single()
          
          const currentPaid = listData?.total_paid || 0
          await supabase
            .from("lists")
            .update({ total_paid: currentPaid + 1 })
            .eq("id", listaId)
        }
      }
    }
    
    return NextResponse.json({ success: true, received: true })
  } catch (error: any) {
    console.error("[Webhook PagueX] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Also handle GET for webhook verification
export async function GET() {
  return NextResponse.json({ status: "ok", webhook: "paguex" })
}
