import { useEffect, useState } from 'react'
import api from '@/api/client'
import type { User } from '@/types'
import { Trash2, Search, RefreshCw } from 'lucide-react'

interface PaginatedUsers {
  items: User[]
  total: number
  page: number
  pages: number
}

export default function UserManagePage() {
  const [data, setData] = useState<PaginatedUsers | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [resetModal, setResetModal] = useState<{ open: boolean; userId?: string }>({ open: false })
  const [newPassword, setNewPassword] = useState('')

  const fetchUsers = () => {
    setLoading(true)
    api.get('/admin/users', { params: { search, page, per_page: 20 } })
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const handleDelete = async (id: string, nickname: string) => {
    if (!confirm(`确定删除用户 "${nickname}"?`)) return
    await api.delete(`/admin/users/${id}`)
    fetchUsers()
  }

  const handleResetPassword = async () => {
    if (!resetModal.userId || newPassword.length < 6) return
    await api.post(`/admin/users/${resetModal.userId}/reset-password`, { new_password: newPassword })
    setResetModal({ open: false })
    setNewPassword('')
    alert('密码已重置')
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">用户管理</h2>
        <p className="text-gray-500 text-sm mt-1">共 {data?.total ?? 0} 名用户</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索用户名..."
            className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          搜索
        </button>
      </form>

      {loading ? (
        <div className="text-center py-8 text-gray-400">加载中...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">用户名</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">角色</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">注册时间</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.items.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.nickname}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.is_admin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {user.is_admin ? '管理员' : '普通用户'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setResetModal({ open: true, userId: user.id })}
                        className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-50"
                      >
                        <RefreshCw size={11} /> 重置密码
                      </button>
                      {!user.is_admin && (
                        <button
                          onClick={() => handleDelete(user.id, user.nickname)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded text-sm ${p === page ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Reset password modal */}
      {resetModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-4">重置密码</h3>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="新密码（至少6位）"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setResetModal({ open: false })} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">取消</button>
              <button
                onClick={handleResetPassword}
                disabled={newPassword.length < 6}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
