export async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Se for erro de rate limit (429), espera mais tempo
      if (lastError.message.includes("429") || lastError.message.includes("Too Many")) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
        console.log(`[v0] Rate limit hit, retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      // Para outros erros, não retenta
      throw lastError
    }
  }

  throw lastError
}
