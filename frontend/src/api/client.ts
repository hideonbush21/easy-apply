import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
})

api.interceptors.request.use(config => {
  // 从 Zustand persist 存储中读取 token（单一来源）
  try {
    const raw = localStorage.getItem('auth-storage')
    if (raw) {
      const parsed = JSON.parse(raw)
      const token = parsed?.state?.token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
  } catch {
    // JSON 解析失败则忽略
  }
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // 登录/注册接口本身会返回 401（密码错误、验证码错误），不应触发跳转
      const url: string = err.config?.url || ''
      const isAuthEndpoint = url.startsWith('/auth/')
      if (!isAuthEndpoint) {
        localStorage.removeItem('auth-storage')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
