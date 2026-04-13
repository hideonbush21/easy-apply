import { useEffect, useRef, useState, useCallback } from 'react'

/* ─── Data ─── */
interface Todo { text: string; completed: boolean }
interface TLNode { id: number; month: string; title: string; icon: string; todos: Todo[] }

const NODES: TLNode[] = [
  { id: 1, month: '9-10月', title: '选校定向', icon: '🎯',
    todos: [
      { text: '确定目标国家和学位类型', completed: false },
      { text: '整理 GPA / 语言成绩', completed: false },
      { text: '完成背景评估问卷', completed: false },
      { text: '生成初步选校清单', completed: false },
    ] },
  { id: 2, month: '10-11月', title: '材料准备', icon: '📁',
    todos: [
      { text: '准备成绩单（官方版本）', completed: false },
      { text: '撰写 / 修改 CV 简历', completed: false },
      { text: '联系推荐人，准备推荐信', completed: false },
      { text: '语言成绩（托福/雅思）', completed: false },
    ] },
  { id: 3, month: '11-12月', title: '文书撰写', icon: '✍️',
    todos: [
      { text: '完成 Personal Statement 初稿', completed: false },
      { text: 'AI 辅助润色文书', completed: false },
      { text: '导师/学长审阅修改', completed: false },
      { text: '各校定制化文书版本', completed: false },
    ] },
  { id: 4, month: '1-2月', title: '提交申请', icon: '🚀',
    todos: [
      { text: '检查各校材料清单', completed: false },
      { text: '支付申请费', completed: false },
      { text: '在线提交申请系统', completed: false },
      { text: '确认推荐信已提交', completed: false },
    ] },
  { id: 5, month: '3-5月', title: '等待结果', icon: '⏳',
    todos: [
      { text: '跟踪各校申请状态', completed: false },
      { text: '准备可能的面试', completed: false },
      { text: '收到 Offer 确认 Deposit', completed: false },
      { text: '申请学生签证材料', completed: false },
    ] },
  { id: 6, month: '5-8月', title: '行前准备', icon: '✈️',
    todos: [
      { text: '提交签证申请', completed: false },
      { text: '预订机票和住宿', completed: false },
      { text: '购买留学生保险', completed: false },
      { text: '办理银行卡/汇款安排', completed: false },
    ] },
]

/* ─── Geometry ─── */
interface Pt { x: number; y: number }

function buildLayout(W: number, H: number) {
  const padX = 100, padY = 80, r = 44
  const left = padX, right = W - padX
  const row: [number, number, number] = [
    padY + (H - padY * 2) * 0.18,
    padY + (H - padY * 2) * 0.52,
    padY + (H - padY * 2) * 0.86,
  ]
  const avail = right - left

  // 3 rows × 2 nodes — serpentine order
  const pts: Pt[] = [
    { x: left + avail * 0.28, y: row[0] },  // 0 row1-left
    { x: left + avail * 0.72, y: row[0] },  // 1 row1-right
    { x: left + avail * 0.72, y: row[1] },  // 2 row2-right
    { x: left + avail * 0.28, y: row[1] },  // 3 row2-left
    { x: left + avail * 0.28, y: row[2] },  // 4 row3-left
    { x: left + avail * 0.72, y: row[2] },  // 5 row3-right
  ]

  // Rounded rectangular serpentine path
  // row1: left → right, right turn ↓, row2: right → left, left turn ↓, row3: left → right
  const d = [
    `M ${left} ${row[0]}`,
    `H ${right - r}  Q ${right} ${row[0]}  ${right} ${row[0] + r}`,
    `V ${row[1] - r}  Q ${right} ${row[1]}  ${right - r} ${row[1]}`,
    `H ${left + r}    Q ${left}  ${row[1]}  ${left}  ${row[1] + r}`,
    `V ${row[2] - r}  Q ${left}  ${row[2]}  ${left + r} ${row[2]}`,
    `H ${right}`,
  ].join(' ')

  return { pts, d, left, right, row }
}

/* ─── Helpers ─── */
// Rough path-fraction for each node (used for active-path reveal)
// Path total: ~2 horizontal rows + 2 vertical legs + 2 corners
const NODE_FRACS = [0.13, 0.34, 0.50, 0.66, 0.80, 0.94]

export default function TimelinePage() {
  const wrapRef   = useRef<HTMLDivElement>(null)
  const mainRef   = useRef<SVGPathElement>(null)
  const activeRef = useRef<SVGPathElement>(null)

  const [wh, setWh] = useState({ W: 0, H: 0 })
  const [nodes, setNodes]       = useState<TLNode[]>(() => {
    try {
      const saved = localStorage.getItem('tl_checklist')
      if (saved) return JSON.parse(saved) as TLNode[]
    } catch {}
    return NODES
  })
  const [activeId, setActiveId]   = useState(1)
  const [pinnedId, setPinnedId]   = useState<number | null>(null)
  const [detailId, setDetailId]   = useState<number | null>(null)
  const [newTodo, setNewTodo]     = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // measure
  useEffect(() => {
    const measure = () => {
      const el = wrapRef.current
      if (el) setWh({ W: el.offsetWidth, H: el.offsetHeight })
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  const { W, H } = wh
  const ready = W > 0 && H > 0
  const geo = ready ? buildLayout(W, H) : null

  // draw main path on mount
  useEffect(() => {
    if (!ready || !mainRef.current) return
    const len = mainRef.current.getTotalLength()
    mainRef.current.style.strokeDasharray = String(len)
    mainRef.current.style.strokeDashoffset = String(len)
    mainRef.current.style.transition = 'stroke-dashoffset 1.6s ease-out'
    requestAnimationFrame(() => {
      if (mainRef.current) mainRef.current.style.strokeDashoffset = '0'
    })
    // init active path to first node
    if (activeRef.current) {
      activeRef.current.style.strokeDasharray = String(len)
      setActivePath(0, len)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, geo?.d])

  const setActivePath = (nodeIdx: number, len?: number) => {
    if (!activeRef.current || !mainRef.current) return
    const totalLen = len ?? mainRef.current.getTotalLength()
    const frac = NODE_FRACS[nodeIdx] ?? 1
    activeRef.current.style.transition = 'stroke-dashoffset 0.35s ease'
    activeRef.current.style.strokeDashoffset = String(totalLen * (1 - frac))
  }

  const handleEnter = useCallback((id: number, idx: number) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    setPinnedId(id)
    setActivePath(idx)
  }, [])

  // leave does nothing — card stays pinned to last hovered node
  const handleLeave = useCallback(() => {}, [])

  const handleClick = useCallback((id: number, idx: number) => {
    setActiveId(id)
    setDetailId(id)   // open detail drawer
    setActivePath(idx)
  }, [])

  const toggleTodo = (nodeId: number, ti: number) => {
    setNodes(prev => prev.map(n =>
      n.id === nodeId
        ? { ...n, todos: n.todos.map((t, i) => i === ti ? { ...t, completed: !t.completed } : t) }
        : n
    ))
  }

  // pinned card: last hovered; click blank space → reset to active node
  const cardVisible = (id: number) => pinnedId ? id === pinnedId : id === activeId

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100vh', background: '#fff', position: 'relative', overflow: 'hidden' }}
      onClick={e => {
        // click on blank canvas → reset pinned card back to active node
        if ((e.target as HTMLElement).closest('.tl-node-group, .tl-card-group') === null) {
          setPinnedId(null)
        }
      }}>

      {/* ── Header ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 54, zIndex: 40,
        background: 'rgba(255,255,255,0.95)',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>留学申请时间轴</span>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>悬停节点查看待办</span>
        </div>
        <button style={{ padding: '6px 16px', background: '#1dd3b0', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
          导出计划
        </button>
      </div>

      {ready && geo && (() => {
        const { pts, d } = geo
        return (
          <>
            {/* ── SVG curves ── */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, overflow: 'visible' }}
              viewBox={`0 0 ${W} ${H}`}>
              {/* base */}
              <path ref={mainRef} d={d} fill="none" stroke="#e5e7eb" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              {/* active highlight */}
              <path ref={activeRef} d={d} fill="none" stroke="#1dd3b0" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 6px rgba(29,211,176,0.5))' }} />
            </svg>

            {/* ── Node dots + labels (hover triggers here) ── */}
            {pts.map((pt, i) => {
              const node = nodes[i]
              const isActive  = node.id === activeId
              const isHovered = node.id === pinnedId
              const dotSize = isActive ? 22 : isHovered ? 18 : 13
              return (
                <div key={node.id}
                  className="tl-node-group"
                  onMouseEnter={() => handleEnter(node.id, i)}
                  onMouseLeave={handleLeave}
                  onClick={() => handleClick(node.id, i)}
                  style={{
                    position: 'absolute',
                    left: pt.x, top: pt.y,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 15, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                  }}>
                  <div style={{
                    width: dotSize, height: dotSize, borderRadius: '50%',
                    background: isActive ? '#1dd3b0' : isHovered ? '#5ee8d3' : '#cbd5e1',
                    border: '3px solid #fff',
                    boxShadow: isActive
                      ? '0 0 0 5px rgba(29,211,176,0.18), 0 4px 14px rgba(29,211,176,0.4)'
                      : '0 2px 6px rgba(0,0,0,0.1)',
                    transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                  }} />
                  <div style={{
                    marginTop: 7, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                    color: isActive ? '#1dd3b0' : '#6b7280',
                    transition: 'color 0.2s',
                  }}>{node.month}</div>
                </div>
              )
            })}

            {/* ── Todo cards — rendered at ROOT level, correct absolute coords ── */}
            {pts.map((pt, i) => {
              const node = nodes[i]
              const visible = cardVisible(node.id)
              const done = node.todos.filter(t => t.completed).length
              const pct  = Math.round(done / node.todos.length * 100)

              // card above for bottom-row nodes, below for top-row nodes
              const cardAbove = pt.y > H * 0.45
              const cardTop = cardAbove ? pt.y - 240 : pt.y + 42
              const cardLeft = Math.max(8, Math.min(pt.x - 125, W - 266))

              return (
                <div key={`card-${node.id}`}
                  className="tl-card-group"
                  onMouseEnter={() => handleEnter(node.id, i)}
                  onMouseLeave={handleLeave}
                  style={{
                    position: 'absolute',
                    left: cardLeft, top: cardTop,
                    width: 254,
                    background: '#fff',
                    borderRadius: 14,
                    border: `1.5px solid ${visible ? '#1dd3b0' : '#e5e7eb'}`,
                    boxShadow: visible
                      ? '0 12px 40px rgba(29,211,176,0.15), 0 4px 12px rgba(0,0,0,0.08)'
                      : '0 2px 8px rgba(0,0,0,0.05)',
                    padding: '14px 16px',
                    opacity: visible ? 1 : 0,
                    transform: visible
                      ? 'translateY(0) scale(1)'
                      : `translateY(${cardAbove ? 8 : -8}px) scale(0.96)`,
                    transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                    pointerEvents: visible ? 'auto' : 'none',
                    zIndex: visible ? 25 : 5,
                  }}>
                  {/* Card header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 17 }}>{node.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{node.title}</span>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: pct === 100 ? '#1dd3b0' : '#9ca3af',
                      background: pct === 100 ? '#e6faf6' : '#f3f4f6',
                      padding: '2px 8px', borderRadius: 20,
                    }}>{pct}%</span>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: '#f3f4f6', marginBottom: 10 }} />

                  {/* Todos */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {node.todos.map((t, ti) => (
                      <div key={ti}
                        onClick={() => toggleTodo(node.id, ti)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 9,
                          padding: '7px 0',
                          borderBottom: ti < node.todos.length - 1 ? '1px solid #f9fafb' : 'none',
                          cursor: 'pointer',
                          transition: 'background 0.1s',
                        }}>
                        <div style={{
                          width: 17, height: 17, borderRadius: 5, flexShrink: 0,
                          border: t.completed ? 'none' : '1.5px solid #d1d5db',
                          background: t.completed ? '#1dd3b0' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}>
                          {t.completed && (
                            <svg width="10" height="10" fill="none" stroke="white" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span style={{
                          fontSize: 12, lineHeight: 1.45,
                          color: t.completed ? '#9ca3af' : '#374151',
                          textDecoration: t.completed ? 'line-through' : 'none',
                          flex: 1,
                        }}>{t.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )
      })()}

      {/* ── Detail Drawer (right slide-in) ── */}
      {(() => {
        const dn = detailId ? nodes.find(n => n.id === detailId) : null
        const open = !!dn
        const done = dn ? dn.todos.filter(t => t.completed).length : 0
        const total = dn ? dn.todos.length : 0
        const pct = total ? Math.round(done / total * 100) : 0
        const circ = 2 * Math.PI * 30

        const addTodo = () => {
          if (!newTodo.trim() || !dn) return
          setNodes(prev => prev.map(n =>
            n.id === dn.id
              ? { ...n, todos: [...n.todos, { text: newTodo.trim(), completed: false }] }
              : n
          ))
          setNewTodo('')
        }

        return (
          <>
            {/* backdrop */}
            <div onClick={() => setDetailId(null)} style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.3)',
              zIndex: 50,
              opacity: open ? 1 : 0,
              visibility: open ? 'visible' : 'hidden',
              transition: 'all 0.28s ease',
            }} />

            {/* drawer */}
            <div style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: 380,
              background: '#fff',
              boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
              zIndex: 51,
              transform: open ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.32s cubic-bezier(0.32,0,0.16,1)',
              display: 'flex', flexDirection: 'column',
            }}>
              {dn && (
                <>
                  {/* Drawer header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '18px 20px',
                    borderBottom: '1px solid #f3f4f6',
                    background: '#fafafa',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: 'linear-gradient(135deg,#1dd3b0,#10b981)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20,
                      }}>{dn.icon}</div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{dn.title}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>{dn.month}</div>
                      </div>
                    </div>
                    <button onClick={() => setDetailId(null)} style={{
                      width: 32, height: 32, borderRadius: 8,
                      border: 'none', background: '#f3f4f6',
                      cursor: 'pointer', fontSize: 16, color: '#6b7280',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                  </div>

                  {/* Scrollable body */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                    {/* Progress ring */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 18,
                      background: '#f9fafb', borderRadius: 14, padding: '16px 20px',
                      marginBottom: 22,
                    }}>
                      <svg width="70" height="70">
                        <circle fill="none" stroke="#e5e7eb" strokeWidth={5} cx="35" cy="35" r="30" />
                        <circle fill="none" stroke="#1dd3b0" strokeWidth={5} strokeLinecap="round"
                          cx="35" cy="35" r="30"
                          strokeDasharray={circ}
                          strokeDashoffset={circ - (pct / 100) * circ}
                          style={{ transform: 'rotate(-90deg)', transformOrigin: '35px 35px', transition: 'stroke-dashoffset 0.5s' }} />
                        <text x="35" y="40" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1dd3b0">{pct}%</text>
                      </svg>
                      <div>
                        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>完成进度</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{done} / {total}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>项任务已完成</div>
                      </div>
                    </div>

                    {/* Todo list */}
                    <div style={{ marginBottom: 22 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="14" height="14" fill="none" stroke="#1dd3b0" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        待办事项
                      </div>
                      {dn.todos.map((t, ti) => (
                        <div key={ti}
                          onClick={() => toggleTodo(dn.id, ti)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 14px', marginBottom: 6,
                            border: '1.5px solid', borderColor: t.completed ? '#d1fae5' : '#e5e7eb',
                            borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                            background: t.completed ? '#f0fdf4' : '#fff',
                          }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                            border: t.completed ? 'none' : '1.5px solid #d1d5db',
                            background: t.completed ? '#1dd3b0' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                          }}>
                            {t.completed && (
                              <svg width="11" height="11" fill="none" stroke="white" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span style={{
                            fontSize: 14, flex: 1,
                            color: t.completed ? '#9ca3af' : '#111827',
                            textDecoration: t.completed ? 'line-through' : 'none',
                          }}>{t.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Add todo */}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="14" height="14" fill="none" stroke="#1dd3b0" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        添加待办
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          value={newTodo}
                          onChange={e => setNewTodo(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addTodo()}
                          placeholder="输入新的待办事项..."
                          style={{
                            flex: 1, padding: '10px 12px',
                            border: '1px solid #e5e7eb', borderRadius: 10,
                            fontSize: 14, outline: 'none',
                          }}
                          onFocus={e => e.target.style.borderColor = '#1dd3b0'}
                          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                        />
                        <button onClick={addTodo} style={{
                          padding: '10px 16px', background: '#1dd3b0',
                          border: 'none', borderRadius: 10,
                          fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer',
                        }}>添加</button>
                      </div>
                    </div>

                    {/* ── Confirm save button ── */}
                    <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #f3f4f6' }}>
                      <button
                        onClick={() => {
                          setSaveState('saving')
                          // persist to localStorage; swap this line for an API call when backend is ready
                          localStorage.setItem('tl_checklist', JSON.stringify(nodes))
                          setTimeout(() => setSaveState('saved'), 600)
                          setTimeout(() => setSaveState('idle'), 2400)
                        }}
                        style={{
                          width: '100%', padding: '12px 0',
                          borderRadius: 12, border: 'none', cursor: 'pointer',
                          fontWeight: 700, fontSize: 15,
                          transition: 'all 0.25s',
                          background: saveState === 'saved'
                            ? '#d1fae5'
                            : 'linear-gradient(135deg,#1dd3b0,#10b981)',
                          color: saveState === 'saved' ? '#065f46' : '#fff',
                          boxShadow: saveState === 'saved' ? 'none' : '0 4px 14px rgba(29,211,176,0.35)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}>
                        {saveState === 'saving' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}
                            style={{ animation: 'tl-spin 0.8s linear infinite' }}>
                            <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
                          </svg>
                        )}
                        {saveState === 'saved' && (
                          <svg width="16" height="16" fill="none" stroke="#065f46" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {saveState === 'saving' ? '保存中…' : saveState === 'saved' ? '已保存' : '确认保存'}
                      </button>
                      <style>{`@keyframes tl-spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )
      })()}
    </div>
  )
}
