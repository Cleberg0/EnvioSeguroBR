import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const ADMIN_USERNAME = "admin"
const ADMIN_PASSWORD = "jones"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Set secure cookie
      const cookieStore = await cookies()
      cookieStore.set("admin_auth", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 })
  }
}
