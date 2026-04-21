import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = (formData.get("type") as string) || "logo"

    if (!file) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const ext = file.name.split(".").pop() || "png"
    const fileName = `${type}-${Date.now()}.${ext}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Try to upload to Supabase Storage bucket "logos"
    const { data, error } = await supabase.storage
      .from("logos")
      .upload(fileName, buffer, {
        contentType: file.type || "image/png",
        upsert: true,
      })

    if (error) {
      console.error("[upload-image] Storage error:", error)
      // Fallback: convert to base64 data URL
      const base64 = buffer.toString("base64")
      const dataUrl = `data:${file.type || "image/png"};base64,${base64}`
      return NextResponse.json({ url: dataUrl })
    }

    // Get public URL
    const { data: publicData } = supabase.storage.from("logos").getPublicUrl(fileName)
    return NextResponse.json({ url: publicData.publicUrl })
  } catch (error: any) {
    console.error("[upload-image] Error:", error)
    return NextResponse.json({ error: error.message || "Erro ao fazer upload" }, { status: 500 })
  }
}
