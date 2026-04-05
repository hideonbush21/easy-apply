import { useEffect, useState } from 'react'
import api from '@/api/client'
import type { User, UserProfile, Application } from '@/types'
import { Trash2, Search, RefreshCw, X, ChevronRight } from 'lucide-react'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { Spinner } from '@/components/ui/Spinner'
import { ProgressBar } from '@/components/ui/ProgressBar'

interface PaginatedUsers {
  items: User[]
  total: number
  page: number
  pages: number
}

interface UserDetail extends User {
  profile: UserProfile | null
  applications: Application[]
}

const TIER_LABEL: Record<string, string> = {
  c9: 'C9', '985': '985', '211': '211',
  double_non: '双非', overseas: '海外', other: '其他',
}

const STATUS_COLOR: Record<string, 'default' | 'success' | 'danger' | 'warning'> = {
  '申请中': 'default',
  '已录取': 'success',
  '已拒绝': 'danger',
  '备选': 'warning',
}

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('zh-CN', { hour12: false }) : '-'

export default function UserManagePage() {
  const [data, setData] = useState<PaginatedUsers | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [resetModal, setResetModal] = useState<{ open: boolean; userId?: string }>({ open: false })
  const [newPassword, setNewPassword] = useState('')
  const [detail, setDetail] = useState<UserDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchUsers = (overridePage?: number, overrideSearch?: string) => {
    setLoading(true)
    api.get('/admin/users', {
      params: { search: overrideSearch ?? search, page: overridePage ?? page, per_page: 20 },
    })
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers(1, search)
  }

  const handleDelete = async (id: string, nickname: string) => {
    if (!confirm(`确定删除用户 "${nickname}"?`)) return
    await api.delete(`/admin/users/${id}`)
    if (detail?.id === id) setDetail(null)
    fetchUsers(page, search)
  }

  const handleResetPassword = async () => {
    if (!resetModal.userId || newPassword.length < 6) return
    await api.post(`/admin/users/${resetModal.userId}/reset-password`, { new_password: newPassword })
    setResetModal({ open: false })
    setNewPassword('')
    alert('密码已重置')
  }

  const handleRowClick = (user: User) => {
    if (detail?.id === user.id) { setDetail(null); return }
    setDetailLoading(true)
    setDetail(null)
    api.get(`/admin/users/${user.id}`)
      .then(r => setDetail(r.data))
      .finally(() => setDetailLoading(false))
  }

  return (
    <div className="p-8 flex gap-6 items-start" style={{ animation: 'fade-in 0.3s ease-out' }}>
      {/* 左侧用户列表 */}
      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">用户管理</h2>
          <p className="text-slate-500 text-sm mt-1 tabular-nums">共 {data?.total ?? 0} 名用户</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索用户名..."
              className="pl-8 pr-3 py-2 w-full border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            />
          </div>
          <Button type="submit">搜索</Button>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
            <Spinner /> <span className="text-sm">加载中...</span>
          </div>
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>用户名</Table.Head>
                  <Table.Head className="w-24">角色</Table.Head>
                  <Table.Head className="w-44">最近登录</Table.Head>
                  <Table.Head className="w-32"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data?.items.map(user => (
                  <Table.Row
                    key={user.id}
                    onClick={() => handleRowClick(user)}
                    className={`cursor-pointer ${detail?.id === user.id ? 'bg-primary-50' : ''}`}
                  >
                    <Table.Cell className="font-medium text-slate-900">
                      <span className="flex items-center gap-1">
                        {user.nickname}
                        <ChevronRight size={13} className="text-slate-300" />
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant={user.is_admin ? 'accent' : 'default'}>
                        {user.is_admin ? '管理员' : '普通用户'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell className="text-slate-500 text-xs tabular-nums">
                      <div>{user.last_login_at ? fmt(user.last_login_at) : '从未登录'}</div>
                      {user.last_login_ip && <div className="text-slate-400 font-mono">{user.last_login_ip}</div>}
                    </Table.Cell>
                    <Table.Cell onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setResetModal({ open: true, userId: user.id })}
                        >
                          <RefreshCw size={11} /> 重置密码
                        </Button>
                        {!user.is_admin && (
                          <button
                            onClick={() => handleDelete(user.id, user.nickname)}
                            className="text-slate-300 hover:text-danger-500 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>

            {data && (
              <Pagination
                page={page}
                pages={data.pages}
                total={data.total}
                onPageChange={setPage}
                className="mt-5"
              />
            )}
          </>
        )}
      </div>

      {/* 右侧详情面板 */}
      {(detail || detailLoading) && (
        <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm p-5 sticky top-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 text-sm">用户详情</h3>
            <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={15} />
            </button>
          </div>

          {detailLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : detail && (
            <div className="space-y-5 text-sm">
              {/* 账号信息 */}
              <section>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">账号信息</p>
                <dl className="space-y-1.5">
                  {[
                    ['用户名', detail.nickname],
                    ['注册时间', fmt(detail.created_at)],
                    ['最近登录', fmt(detail.last_login_at)],
                    ['登录 IP', detail.last_login_ip ?? '-'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-2">
                      <dt className="text-slate-500 shrink-0">{label}</dt>
                      <dd className="text-slate-700 font-mono text-xs text-right truncate">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              {/* 个人档案 */}
              {detail.profile && (
                <section>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">个人档案</p>
                  <dl className="space-y-1.5">
                    {[
                      ['姓名', detail.profile.name ?? '-'],
                      ['院校', detail.profile.home_institution ?? '-'],
                      ['层次', detail.profile.institution_tier ? (TIER_LABEL[detail.profile.institution_tier] ?? detail.profile.institution_tier) : '-'],
                      ['GPA', detail.profile.gpa != null ? `${detail.profile.gpa} / ${detail.profile.gpa_scale ?? 4}` : '-'],
                      ['目标国家', detail.profile.target_countries?.join('、') || '-'],
                      ['目标专业', detail.profile.target_majors?.join('、') || '-'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-2">
                        <dt className="text-slate-500 shrink-0">{label}</dt>
                        <dd className="text-slate-700 text-right truncate max-w-[160px]">{value}</dd>
                      </div>
                    ))}
                    <div className="pt-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-500">档案完整度</span>
                        <span className="text-slate-700">{detail.profile.completion_rate}%</span>
                      </div>
                      <ProgressBar value={detail.profile.completion_rate} size="sm" />
                    </div>
                  </dl>
                </section>
              )}

              {/* 申请记录 */}
              <section>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  申请记录 <span className="text-slate-300 font-normal">({detail.applications.length})</span>
                </p>
                {detail.applications.length === 0 ? (
                  <p className="text-slate-400 text-xs">暂无申请</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.applications.map(app => (
                      <li key={app.id} className="flex items-start justify-between gap-2 py-1.5 border-b border-slate-100 last:border-0">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 truncate text-xs">
                            {app.school?.name_cn || app.school?.name || '-'}
                          </p>
                          <p className="text-slate-400 text-xs">{app.priority} · {app.application_deadline || '未知截止'}</p>
                        </div>
                        <Badge variant={STATUS_COLOR[app.status] ?? 'default'} className="shrink-0 text-xs">
                          {app.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      )}

      {/* 重置密码弹窗 */}
      <Modal
        open={resetModal.open}
        onClose={() => { setResetModal({ open: false }); setNewPassword('') }}
        title="重置密码"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetModal({ open: false })}>取消</Button>
            <Button onClick={handleResetPassword} disabled={newPassword.length < 6}>确认重置</Button>
          </>
        }
      >
        <Input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          placeholder="新密码（至少6位）"
          label="新密码"
        />
      </Modal>
    </div>
  )
}
