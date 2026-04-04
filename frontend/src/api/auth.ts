import api from './client'

export const login = (nickname: string, password: string) =>
  api.post('/auth/login', { nickname, password })

export const register = (nickname: string, password: string) =>
  api.post('/auth/register', { nickname, password })

export const refreshToken = (refresh_token: string) =>
  api.post('/auth/refresh', { refresh_token })
