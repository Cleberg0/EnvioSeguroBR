export class RateLimiter {
  private requests: Map<string, number[]> = new Map()

  constructor(
    private maxRequests: number,
    private windowMs: number,
  ) {}

  async check(key: string): Promise<boolean> {
    const now = Date.now()
    const requests = this.requests.get(key) || []

    // Remove requisições antigas fora da janela de tempo
    const validRequests = requests.filter((time) => now - time < this.windowMs)

    if (validRequests.length >= this.maxRequests) {
      return false // Rate limit excedido
    }

    validRequests.push(now)
    this.requests.set(key, validRequests)
    return true
  }
}

// Rate limiter global para API externa de CPF: 10 requisições por segundo
export const cpfApiLimiter = new RateLimiter(10, 1000)

// Rate limiter para gateway de pagamento: 5 requisições por segundo
export const paymentLimiter = new RateLimiter(5, 1000)
