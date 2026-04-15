"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"

interface CompanySettings {
  company_name: string
  logo_url: string
  banner_url: string
}

export default function PagamentoPage() {
  const [copied, setCopied] = useState(false)
  const [pixData, setPixData] = useState<{ qrCode: string; pixKey: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<CompanySettings>({
    company_name: "",
    logo_url: "",
    banner_url: "",
  })
  const qrCodeRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    loadSettings()

    const qrCode = searchParams.get("qrCode")
    const pixKey = searchParams.get("pixKey")

    if (qrCode && pixKey) {
      setPixData({ qrCode, pixKey })
      setLoading(false)
    } else {
      createPayment()
    }

    setTimeout(() => {
      qrCodeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 300)
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const createPayment = async () => {
    try {
      setLoading(true)

      const cpf = searchParams.get("cpf") || ""
      const name = searchParams.get("name") || "Cliente"

      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 37.83,
          customerCPF: cpf,
          customerName: name,
        }),
      })

      if (!response.ok) throw new Error("Failed to create payment")

      const data = await response.json()
      setPixData({ qrCode: data.qrCode, pixKey: data.pixKey })
    } catch (error) {
      console.error("Error creating payment:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (pixData?.pixKey) {
      navigator.clipboard.writeText(pixData.pixKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-center">
            {settings.logo_url ? (
              <img
                src={settings.logo_url || "/placeholder.svg"}
                alt="EnvioSeguroBR"
                className="h-16 sm:h-20 w-auto object-contain"
              />
            ) : (
              <img
                src="/EnvioBr-logo.png"
                alt="EnvioSeguroBR"
                className="h-16 sm:h-20 w-auto object-contain"
              />
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        <div ref={qrCodeRef} className="bg-white border border-gray-200 rounded shadow-sm p-6 space-y-5">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900">Regularize seu Pacote</h1>
            <p className="text-3xl font-extrabold text-green-700 mt-3">R$ 37,83</p>
          </div>

          <div className="flex justify-center py-4">
            {loading || !pixData ? (
              <div className="w-48 h-48 rounded bg-gray-100 flex items-center justify-center">
                <div className="h-6 w-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${encodeURIComponent(pixData.pixKey)}`}
                alt="QR Code PIX"
                className="w-48 h-48 rounded border border-gray-200"
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700 uppercase">Código PIX Copia e Cola</label>
            <div className="flex gap-2">
              <div className="flex-1 min-w-0 rounded border border-gray-300 bg-gray-50 px-3 h-11 flex items-center">
                <p className="truncate text-xs font-mono text-gray-900">{pixData?.pixKey || "Carregando..."}</p>
              </div>
              <Button
                onClick={handleCopy}
                disabled={!pixData}
                className="h-11 px-5 bg-green-800 hover:bg-[#14472c] text-white font-bold rounded whitespace-nowrap"
              >
                {copied ? "✓ Copiado" : "COPIAR"}
              </Button>
            </div>
          </div>

          <div className="rounded bg-green-50 border-2 border-green-300 p-4">
            <p className="text-sm text-gray-900 text-center leading-relaxed font-medium">
              Após o pagamento, a entrega do seu pedido será liberada automaticamente e seguirá normalmente.
            </p>
          </div>

          <Button
            onClick={() => (window.location.href = "/")}
            variant="outline"
            className="w-full h-11 border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50"
          >
            ← Voltar para Rastreamento
          </Button>
        </div>
      </main>

      <footer className="mt-12 bg-[#1a5c38] text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div>
              <h3 className="font-bold text-base mb-3">Cliente</h3>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <a href="#" className="hover:underline">
                    Seja VIP
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Consulta de Rastreio
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Encontre um Ponto EnvioSeguroBR
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Consulta de Frete
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Atividades populares
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-base mb-3">Suporte ao Cliente</h3>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <a href="#" className="hover:underline">
                    Serviços B2C
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Serviços C2C
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Serviços CBT
                  </a>
                </li>
              </ul>
              <h3 className="font-bold text-base mb-3 mt-4">Fale Conosco</h3>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <a href="#" className="hover:underline">
                    Cooperação
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-base mb-3">Junte-se a Nós</h3>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <a href="#" className="hover:underline">
                    Torne-se um Motorista
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Vagas de Emprego
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-base mb-3">Informações</h3>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <a href="#" className="hover:underline">
                    Política de Privacidade
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Termos de Uso
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 pt-6 space-y-4">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="text-center space-y-1">
                <p>contato@enviosegurobr.com</p>
              </div>
            </div>

            <div className="text-xs text-white/80 text-center space-y-1">
              <p className="font-semibold">CNPJ: 00.000.000/0001-00</p>
              <p>
                Av. das Américas, 500, Centro, São Paulo, SP, CEP 01310-100
              </p>
            </div>

            <div className="text-center pt-4 border-t border-white/20">
              <p className="text-sm font-medium">© EnvioSeguroBR 2025</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
