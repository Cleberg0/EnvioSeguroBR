import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Truck, Package, Clock, Shield, MapPin, Users } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center">
            <img
              src="/EnvioBr-logo.png"
              alt="EnvioSeguroBR"
              className="h-20 w-auto"
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-800 to-[#14472c] text-white py-16">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">Entregas Rápidas e Seguras em Todo Brasil</h1>
          <p className="text-lg sm:text-xl mb-8 text-white/90">
            A EnvioSeguroBR é líder em logística expressa no Brasil, com soluções
            completas para e-commerce e entregas de última milha.
          </p>
          <Link href="/">
            <Button size="lg" className="bg-white text-green-800 hover:bg-gray-100 font-bold px-8 py-6 text-lg">
              Rastrear Meu Pedido
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Por que escolher a EnvioSeguroBR?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Truck className="h-6 w-6 text-green-700" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Entrega Rápida</h3>
              <p className="text-gray-600">
                Frota moderna e tecnologia de IA para otimização de rotas, garantindo entregas ágeis em todo território
                nacional.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-green-700" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Rastreamento em Tempo Real</h3>
              <p className="text-gray-600">
                Acompanhe seu pedido a qualquer momento com nosso sistema de rastreamento online atualizado em tempo
                real.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-green-700" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Segurança Total</h3>
              <p className="text-gray-600">
                Seus pacotes são tratados com máximo cuidado e segurança durante todo o processo de transporte e
                entrega.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-green-700" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Atendimento 24/7</h3>
              <p className="text-gray-600">
                Suporte ao cliente disponível todos os dias da semana para resolver suas dúvidas e questões.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-green-700" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Cobertura Nacional</h3>
              <p className="text-gray-600">
                Presença em todos os estados brasileiros com filiais estratégicas e centros de distribuição modernos.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-700" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">8 Anos de Experiência</h3>
              <p className="text-gray-600">
                Desde 2015, atendendo milhões de clientes em 13 mercados ao redor do mundo com excelência.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-800 text-white py-16">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Rastreie Sua Encomenda Agora</h2>
          <p className="text-lg mb-8 text-white/90">
            Digite seu CPF ou código de rastreamento para acompanhar o status da sua entrega em tempo real.
          </p>
          <Link href="/">
            <Button size="lg" className="bg-white text-green-800 hover:bg-gray-100 font-bold px-10 py-6 text-lg">
              Consultar Rastreamento
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div>
              <h3 className="font-bold text-base mb-3">Cliente</h3>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <Link href="#" className="hover:underline">
                    Seja VIP
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:underline">
                    Consulta de Rastreio
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Encontre um Ponto EnvioSeguroBR
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Consulta de Frete
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-base mb-3">Suporte ao Cliente</h3>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <Link href="#" className="hover:underline">
                    Serviços B2C
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Serviços C2C
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Serviços CBT
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-base mb-3">Junte-se a Nós</h3>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <Link href="#" className="hover:underline">
                    Torne-se um Motorista
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Vagas de Emprego
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-base mb-3">Informações</h3>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <Link href="#" className="hover:underline">
                    Política de Privacidade
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Termos de Uso
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 pt-6 text-center text-sm">
            <p className="font-semibold">© EnvioSeguroBR 2025</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
