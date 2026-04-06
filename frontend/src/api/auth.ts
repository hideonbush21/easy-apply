import api from './client'

async function sha256Hex(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export const login = async (nickname: string, password: string) => {
  const hashedPassword = await sha256Hex(password)
  try {
    return await api.post('/auth/login', { nickname, password: hashedPassword })
  } catch (err: unknown) {
    const e = err as { response?: { data?: { code?: string } } }
    if (e.response?.data?.code === 'LEGACY_ACCOUNT') {
      // Transparent migration: re-try with plaintext, backend will re-hash on success
      return api.post('/auth/legacy-login', { nickname, password })
    }
    throw err
  }
}

export const register = async (nickname: string, password: string) => {
  const hashedPassword = await sha256Hex(password)
  return api.post('/auth/register', { nickname, password: hashedPassword })
}

export const refreshToken = (refresh_token: string) =>
  api.post('/auth/refresh', { refresh_token })

export { sha256Hex }
