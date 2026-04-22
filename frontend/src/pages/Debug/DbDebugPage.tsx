import { useState, useEffect, useCallback } from 'react'
import { getDebugTables, getDebugTableRows, createDebugRow, updateDebugRow, deleteDebugRow } from '@/api/debug'
import type { DebugTable, DebugRowsResponse } from '@/api/debug'
import { Database, Table, RefreshCw, ChevronDown, ChevronRight, ArrowLeft, ArrowRight, Plus, Pencil, Trash2, Save, X, Search } from 'lucide-react'

const ROW_LIMIT = 50

export default function DbDebugPage() {
  const [tables, setTables] = useState<DebugTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedTable, setExpandedTable] = useState<string | null>(null)
  const [rowResp, setRowResp] = useState<DebugRowsResponse | null>(null)
  const [rowLoading, setRowLoading] = useState(false)
  const [rowOffset, setRowOffset] = useState(0)

  // CRUD states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingRowIdx, setEditingRowIdx] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<Record<string, string>>({})
  const [createDraft, setCreateDraft] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [opError, setOpError] = useState('')

  // Search
  const [tableFilter, setTableFilter] = useState('')

  const fetchTables = useCallback(() => {
    setLoading(true)
    setError('')
    getDebugTables()
      .then(r => setTables(r.data.tables))
      .catch(e => setError(e.response?.data?.error || '加载失败'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchTables() }, [fetchTables])

  const expandedMeta = tables.find(t => t.table_name === expandedTable)

  const loadRows = useCallback((tableName: string, offset: number) => {
    setRowLoading(true)
    getDebugTableRows(tableName, ROW_LIMIT, offset)
      .then(r => setRowResp(r.data))
      .catch(() => setRowResp(null))
      .finally(() => setRowLoading(false))
  }, [])

  const handleExpand = (tableName: string) => {
    if (expandedTable === tableName) {
      setExpandedTable(null)
      setRowResp(null)
      setEditingRowIdx(null)
      return
    }
    setExpandedTable(tableName)
    setRowOffset(0)
    setEditingRowIdx(null)
    loadRows(tableName, 0)
  }

  const handlePage = (dir: 'prev' | 'next') => {
    if (!expandedTable) return
    const newOff = dir === 'next' ? rowOffset + ROW_LIMIT : Math.max(0, rowOffset - ROW_LIMIT)
    setRowOffset(newOff)
    setEditingRowIdx(null)
    loadRows(expandedTable, newOff)
  }

  const refreshCurrent = () => {
    if (expandedTable) loadRows(expandedTable, rowOffset)
    fetchTables()
  }

  // ── PRIMARY KEY helpers ──
  const getPk = (row: Record<string, unknown>, pks: string[]): Record<string, unknown> => {
    const pk: Record<string, unknown> = {}
    for (const k of pks) pk[k] = row[k]
    return pk
  }

  // ── CREATE ──
  const openCreate = () => {
    if (!expandedMeta) return
    const draft: Record<string, string> = {}
    expandedMeta.columns.forEach(c => { draft[c.name] = '' })
    setCreateDraft(draft)
    setOpError('')
    setShowCreateModal(true)
  }

  const handleCreate = async () => {
    if (!expandedTable) return
    setSaving(true)
    setOpError('')
    // 过滤掉空值字段（让 DB 用默认值）
    const payload: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(createDraft)) {
      if (v !== '') payload[k] = v
    }
    try {
      await createDebugRow(expandedTable, payload)
      setShowCreateModal(false)
      refreshCurrent()
    } catch (e: any) {
      setOpError(e.response?.data?.error || '创建失败')
    } finally {
      setSaving(false)
    }
  }

  // ── EDIT ──
  const startEdit = (idx: number) => {
    if (!rowResp) return
    const row = rowResp.rows[idx]
    const draft: Record<string, string> = {}
    rowResp.columns.forEach(c => { draft[c] = row[c] === null ? '' : String(row[c]) })
    setEditDraft(draft)
    setEditingRowIdx(idx)
    setOpError('')
  }

  const handleSaveEdit = async () => {
    if (!expandedTable || !rowResp || editingRowIdx === null) return
    const pks = rowResp.primary_keys
    if (!pks.length) { setOpError('该表无主键，无法更新'); return }
    const originalRow = rowResp.rows[editingRowIdx]
    const pk = getPk(originalRow, pks)

    // 找出有变化的字段
    const changed: Record<string, unknown> = {}
    for (const col of rowResp.columns) {
      const oldVal = originalRow[col] === null ? '' : String(originalRow[col])
      if (editDraft[col] !== oldVal) {
        changed[col] = editDraft[col]
      }
    }
    if (Object.keys(changed).length === 0) { setEditingRowIdx(null); return }

    setSaving(true)
    setOpError('')
    try {
      await updateDebugRow(expandedTable, pk, changed)
      setEditingRowIdx(null)
      refreshCurrent()
    } catch (e: any) {
      setOpError(e.response?.data?.error || '更新失败')
    } finally {
      setSaving(false)
    }
  }

  // ── DELETE ──
  const handleDelete = async (idx: number) => {
    if (!expandedTable || !rowResp) return
    const pks = rowResp.primary_keys
    if (!pks.length) { setOpError('该表无主键，无法删除'); return }
    const row = rowResp.rows[idx]
    const pk = getPk(row, pks)
    const desc = pks.map(k => `${k}=${row[k]}`).join(', ')
    if (!window.confirm(`确认删除此行？(${desc})`)) return

    setSaving(true)
    setOpError('')
    try {
      await deleteDebugRow(expandedTable, pk)
      refreshCurrent()
    } catch (e: any) {
      setOpError(e.response?.data?.error || '删除失败')
    } finally {
      setSaving(false)
    }
  }

  const totalRows = tables.reduce((sum, t) => sum + t.row_count, 0)
  const filteredTables = tableFilter
    ? tables.filter(t => t.table_name.toLowerCase().includes(tableFilter.toLowerCase()))
    : tables

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>数据库调试</h1>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
              {tables.length} 张表 · {totalRows.toLocaleString()} 行数据
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#9ca3af' }} />
            <input
              value={tableFilter}
              onChange={e => setTableFilter(e.target.value)}
              placeholder="搜索表名…"
              style={{ padding: '7px 12px 7px 30px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, width: 180, outline: 'none' }}
            />
          </div>
          <button onClick={fetchTables} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151' }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            刷新
          </button>
        </div>
      </div>

      {error && <ErrorBanner msg={error} />}
      {opError && <ErrorBanner msg={opError} onClose={() => setOpError('')} />}

      {/* Table list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filteredTables.map(t => {
          const isExpanded = expandedTable === t.table_name
          const hasPk = t.primary_keys.length > 0
          return (
            <div key={t.table_name} style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #e5e7eb', overflow: 'hidden' }}>
              {/* Table header row */}
              <div onClick={() => handleExpand(t.table_name)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer', userSelect: 'none', background: isExpanded ? '#f8fafc' : '#fff', transition: 'background 0.15s' }}>
                {isExpanded ? <ChevronDown size={14} color="#6366f1" /> : <ChevronRight size={14} color="#9ca3af" />}
                <Table size={14} color={isExpanded ? '#6366f1' : '#6b7280'} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', fontFamily: 'monospace' }}>{t.table_name}</span>
                {!hasPk && <span style={{ fontSize: 10, color: '#f59e0b', background: '#fef9c3', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>无主键</span>}
                <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 'auto' }}>{t.columns.length} 列 · {t.row_count.toLocaleString()} 行</span>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid #f3f4f6' }}>
                  {/* Schema */}
                  <div style={{ padding: '12px 18px', background: '#fafafa' }}>
                    <p style={sectionTitle}>表结构 {t.primary_keys.length > 0 && <span style={{ fontWeight: 400, textTransform: 'none' }}> · 主键: {t.primary_keys.join(', ')}</span>}</p>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <th style={thStyle}>列名</th><th style={thStyle}>类型</th><th style={thStyle}>可空</th><th style={thStyle}>默认值</th>
                          </tr>
                        </thead>
                        <tbody>
                          {t.columns.map(col => (
                            <tr key={col.name} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ ...tdStyle, fontWeight: 500, fontFamily: 'monospace' }}>
                                {col.name}
                                {t.primary_keys.includes(col.name) && <span style={{ marginLeft: 4, fontSize: 9, color: '#6366f1', background: '#eef2ff', padding: '1px 4px', borderRadius: 3 }}>PK</span>}
                              </td>
                              <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#6366f1' }}>{col.type}</td>
                              <td style={tdStyle}>{col.nullable ? 'YES' : 'NO'}</td>
                              <td style={{ ...tdStyle, color: '#9ca3af', fontFamily: 'monospace', fontSize: 11 }}>{col.default ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Data preview with CRUD */}
                  <div style={{ padding: '12px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <p style={sectionTitle}>数据 {rowLoading && '(加载中...)'}</p>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button onClick={openCreate} style={actionBtnStyle('#10b981')}>
                          <Plus size={12} /> 新增行
                        </button>
                        <button onClick={() => handlePage('prev')} disabled={rowOffset === 0} style={pageBtnStyle(rowOffset === 0)}><ArrowLeft size={12} /></button>
                        <span style={{ fontSize: 11, color: '#9ca3af', padding: '0 4px' }}>
                          {t.row_count > 0 ? `${rowOffset + 1}-${Math.min(rowOffset + ROW_LIMIT, t.row_count)}` : '0'} / {t.row_count}
                        </span>
                        <button onClick={() => handlePage('next')} disabled={rowOffset + ROW_LIMIT >= t.row_count} style={pageBtnStyle(rowOffset + ROW_LIMIT >= t.row_count)}><ArrowRight size={12} /></button>
                      </div>
                    </div>

                    <div style={{ overflowX: 'auto', maxHeight: 480, overflowY: 'auto', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                      {rowResp && rowResp.rows.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                          <thead>
                            <tr>
                              <th style={{ ...thStyle, position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, fontSize: 11, width: 80 }}>操作</th>
                              {rowResp.columns.map(col => (
                                <th key={col} style={{ ...thStyle, position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, fontSize: 11 }}>{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rowResp.rows.map((row, i) => {
                              const isEditing = editingRowIdx === i
                              return (
                                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: isEditing ? '#fefce8' : 'transparent' }}>
                                  <td style={{ ...tdStyle, display: 'flex', gap: 4, flexShrink: 0 }}>
                                    {isEditing ? (
                                      <>
                                        <button onClick={handleSaveEdit} disabled={saving} style={iconBtnStyle('#10b981')} title="保存"><Save size={12} /></button>
                                        <button onClick={() => setEditingRowIdx(null)} style={iconBtnStyle('#6b7280')} title="取消"><X size={12} /></button>
                                      </>
                                    ) : (
                                      <>
                                        <button onClick={() => startEdit(i)} style={iconBtnStyle('#6366f1')} title="编辑"><Pencil size={12} /></button>
                                        <button onClick={() => handleDelete(i)} disabled={saving} style={iconBtnStyle('#ef4444')} title="删除"><Trash2 size={12} /></button>
                                      </>
                                    )}
                                  </td>
                                  {rowResp.columns.map(col => (
                                    <td key={col} style={{ ...tdStyle, maxWidth: 220, fontFamily: 'monospace', fontSize: 11, padding: isEditing ? '2px 4px' : tdStyle.padding }}>
                                      {isEditing ? (
                                        <input
                                          value={editDraft[col] ?? ''}
                                          onChange={e => setEditDraft(d => ({ ...d, [col]: e.target.value }))}
                                          style={cellInputStyle}
                                        />
                                      ) : (
                                        row[col] === null
                                          ? <span style={{ color: '#d1d5db' }}>NULL</span>
                                          : <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 220 }}>{String(row[col])}</span>
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
                          {rowLoading ? '加载中...' : '暂无数据'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Create modal */}
      {showCreateModal && expandedMeta && (
        <div style={overlayStyle}>
          <div style={{ background: '#fff', borderRadius: 16, width: 520, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
                新增行 · <span style={{ fontFamily: 'monospace', color: '#6366f1' }}>{expandedTable}</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ border: 'none', background: '#f3f4f6', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#6b7280' }}>×</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
              {opError && <ErrorBanner msg={opError} onClose={() => setOpError('')} />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {expandedMeta.columns.map(col => (
                  <div key={col.name}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'monospace' }}>{col.name}</span>
                      <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 10 }}>{col.type}</span>
                      {col.default && <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 10 }}>默认: {col.default}</span>}
                    </label>
                    <input
                      value={createDraft[col.name] ?? ''}
                      onChange={e => setCreateDraft(d => ({ ...d, [col.name]: e.target.value }))}
                      placeholder={col.nullable ? '留空=NULL' : col.default ? '留空=默认值' : '必填'}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreateModal(false)}
                style={{ padding: '8px 18px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#6b7280' }}>
                取消
              </button>
              <button onClick={handleCreate} disabled={saving}
                style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: '#10b981', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#fff', opacity: saving ? 0.6 : 1 }}>
                {saving ? '保存中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Shared styles ──

function ErrorBanner({ msg, onClose }: { msg: string; onClose?: () => void }) {
  return (
    <div style={{ padding: '10px 16px', borderRadius: 10, background: '#fef2f2', color: '#ef4444', fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span>{msg}</span>
      {onClose && <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 16 }}>×</button>}
    </div>
  )
}

const thStyle: React.CSSProperties = { textAlign: 'left', padding: '6px 12px', fontSize: 11, fontWeight: 600, color: '#6b7280' }
const tdStyle: React.CSSProperties = { padding: '6px 12px', color: '#374151' }
const sectionTitle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }

const pageBtnStyle = (disabled: boolean): React.CSSProperties => ({
  border: '1px solid #e5e7eb', background: '#fff', borderRadius: 6, width: 26, height: 26,
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.4 : 1, color: '#374151',
})

const actionBtnStyle = (color: string): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 4,
  padding: '5px 12px', borderRadius: 8, border: 'none',
  background: color, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
})

const iconBtnStyle = (color: string): React.CSSProperties => ({
  border: 'none', background: `${color}12`, borderRadius: 6, width: 26, height: 26,
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color, flexShrink: 0,
})

const cellInputStyle: React.CSSProperties = {
  width: '100%', padding: '3px 6px', borderRadius: 4, border: '1.5px solid #6366f1',
  fontSize: 11, fontFamily: 'monospace', outline: 'none', background: '#fff', boxSizing: 'border-box',
  minWidth: 80,
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
}
