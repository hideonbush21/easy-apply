import api from './client'

async function sha256Hex(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export const login = async (nickname: string, password: string) => {
  const hashedPassword = await sha256Hex(password)
  return api.post('/auth/login', { nickname, password: hashedPassword })
}

export const register = async (nickname: string, password: string) => {
  const hashedPassword = await sha256Hex(password)
  return api.post('/auth/register', { nickname, password: hashedPassword })
}

export const refreshToken = (refresh_token: string) =>
  api.post('/auth/refresh', { refresh_token })

export { sha256Hex }
