import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getRecommendations,
  getRecommendationStatus,
  triggerRecommendation,
  type RecommendationStatus,
} from '@/api/schools'
import { createApplication } from '@/api/applications'
import type { School } from '@/types'
import { Plus, RefreshCw, Sparkles, Star } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'

type Category = 'reach' | 'match' | 'safety'

const CATEGORY_CONFIG: Record<Category, {
  label: string
  headerCls: string
  badgeVariant: 'danger' | 'primary' | 'success'
  desc: string
  priority: string
}> = {
  reach:  { label: '冲刺', headerCls: 'bg-rose-500/10 border-rose-500/20',     badgeVariant: 'danger',  desc: '匹配度 50-70%，有挑战性', priority: '冲刺' },
  match:  { label: '匹配', headerCls: 'bg-violet-500/10 border-violet-500/20', badgeVariant: 'primary', desc: '匹配度 70-85%，较为合适', priority: '匹配' },
  safety: { label: '保底', headerCls: 'bg-emerald-500/10 border-emerald-500/20', badgeVariant: 'success', desc: '匹配度 >85%，把握较大', priority: '保底' },
}

const POLL_INTERVAL = 3000

export default function RecommendationsPage() {
  const [status, setStatus] = useState<RecommendationStatus | 'checking'>('checking')
  const [data, setData] = useState<Record<Category, School[]> | null>(null)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [triggering, setTriggering] = useState(false)
  const [showNotification, setShowNotification] = useState(false)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevStatusRef = useRef<RecommendationStatus | null>(null)

  const loadResults = useCallback(async () => {
    try {
      const r = await getRecommendations()
      setData(r.data)
    } catch {
      // cache missing — status will handle display
    }
  }, [])

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const checkStatus = useCallback(async (showPopupOnDone = false) => {
    try {
      const r = await getRecommendationStatus()
      const s = r.data.status
      setStatus(s)

      if (s === 'done') {
        if (showPopupOnDone || prevStatusRef.current === 'pending') {
          setShowNotification(true)
        }
        prevStatusRef.current = s
        await loadResults()
        stopPolling()
      } else {
        prevStatusRef.current = s
      }
    } catch {
      setStatus('failed')
      stopPolling()
    }
  }, [loadResults, stopPolling])

  const startPolling = useCallback(() => {
    stopPolling()
    pollRef.current = setInterval(() => {
      checkStatus(false)
    }, POLL_INTERVAL)
  }, [checkStatus, stopPolling])

  // 初始化：检查当前状态
  useEffect(() => {
    checkStatus(false)
    return stopPolling
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 当状态变为 pending 时自动开始轮询
  useEffect(() => {
    if (status === 'pending') {
      startPolling()
    }
    return stopPolling
  }, [status, startPolling, stopPolling])

  const handleTrigger = async () => {
    setTriggering(true)
    try {
      await triggerRecommendation()
      setStatus('pending')
      prevStatusRef.current = 'pending'
    } catch {
      // ignore — status stays as-is
    } finally {
      setTriggering(false)
    }
  }

  const handleAdd = async (school: School, cat: Category) => {
    try {
      await createApplication({
        school_id: school.id,
        priority: CATEGORY_CONFIG[cat].priority,
        application_deadline: school.application_deadline || undefined,
      })
      setAdded(prev => new Set([...prev, school.id]))
    } catch {
      alert('添加失败')
    }
  }

  // ── 状态渲染 ──────────────────────────────────────────────────────────────

  if (status === 'checking') {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
        <Spinner /> <span className="text-sm">加载中...</span>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="p-8" style={{ animation: 'fade-in 0.3s ease-out' }}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">智能推荐</h2>
          <p className="text-slate-400 text-sm mt-1">根据你的档案信息，为你推荐合适的院校</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
          <Spinner />
          <p className="text-sm">AI 正在分析你的档案，生成选校推荐…</p>
          <p className="text-xs text-slate-500">可先去其他页面操作，完成后会有弹窗通知</p>
        </div>
      </div>
    )
  }

  if (status === 'none' || status === 'failed') {
    return (
      <div className="p-8" style={{ animation: 'fade-in 0.3s ease-out' }}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">智能推荐</h2>
          <p className="text-slate-400 text-sm mt-1">根据你的档案信息，为你推荐合适的院校</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Sparkles size={40} className="text-violet-400" />
          <p className="text-slate-300 font-medium">
            {status === 'failed' ? '上次推荐生成失败，请重试' : '还未生成选校推荐'}
          </p>
          <p className="text-xs text-slate-500">点击按钮后将在后台生成，不影响你继续使用</p>
          <Button
            onClick={handleTrigger}
            disabled={triggering}
            className="mt-2"
          >
            {triggering ? <Spinner /> : <Sparkles size={15} />}
            {triggering ? '正在启动…' : '生成选校推荐'}
          </Button>
        </div>
      </div>
    )
  }

  if (status === 'stale') {
    return (
      <div className="p-8" style={{ animation: 'fade-in 0.3s ease-out' }}>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">智能推荐</h2>
            <p className="text-slate-400 text-sm mt-1">根据你的档案信息，为你推荐合适的院校</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleTrigger} disabled={triggering}>
            {triggering ? <Spinner /> : <RefreshCw size={13} />}
            重新生成
          </Button>
        </div>
        <div className="mb-5 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-300">
          档案信息已更新，以下结果基于旧档案。点击「重新生成」获取最新推荐。
        </div>
        <RecommendationGrid data={data} added={added} onAdd={handleAdd} />
      </div>
    )
  }

  // status === 'done'
  return (
    <>
      <div className="p-8" style={{ animation: 'fade-in 0.3s ease-out' }}>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">智能推荐</h2>
            <p className="text-slate-400 text-sm mt-1">根据你的档案信息，为你推荐合适的院校</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleTrigger} disabled={triggering}>
            {triggering ? <Spinner /> : <RefreshCw size={13} />}
            重新生成
          </Button>
        </div>
        <RecommendationGrid data={data} added={added} onAdd={handleAdd} />
      </div>

      <Modal
        open={showNotification}
        onClose={() => setShowNotification(false)}
        title="选校推荐已生成 🎉"
        size="sm"
        footer={
          <Button onClick={() => setShowNotification(false)}>查看推荐结果</Button>
        }
      >
        <p className="text-sm text-slate-300">
          AI 已根据你的档案完成选校推荐，包含冲刺、匹配、保底三类院校，快去看看吧！
        </p>
      </Modal>
    </>
  )
}

// ── 推荐列表子组件 ────────────────────────────────────────────────────────────

function RecommendationGrid({
  data,
  added,
  onAdd,
}: {
  data: Record<Category, School[]> | null
  added: Set<string>
  onAdd: (school: School, cat: Category) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-5">
      {(['reach', 'match', 'safety'] as Category[]).map(cat => {
        const config = CATEGORY_CONFIG[cat]
        const schools = data?.[cat] || []
        return (
          <div key={cat}>
            <div className={`rounded-xl border p-4 mb-3 ${config.headerCls}`}>
              <div className="flex items-center justify-between">
                <Badge variant={config.badgeVariant}>{config.label}</Badge>
                <span className="text-xs text-slate-500 tabular-nums">{schools.length} 所</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">{config.desc}</p>
            </div>

            <div className="space-y-3">
              {schools.length === 0 ? (
                <EmptyState title="暂无推荐" className="py-8" />
              ) : (
                schools.map(school => (
                  <Card key={school.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-white text-sm">{school.name_cn || school.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {school.country} · <span className="tabular-nums">#{school.ranking}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 shrink-0 ml-2">
                        {school.match_score != null && (
                          <>
                            <Star size={12} fill="currentColor" />
                            <span className="text-xs font-medium tabular-nums">{school.match_score}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <Link
                        to={`/schools/${school.id}`}
                        className="text-xs font-medium text-violet-400 hover:text-violet-300"
                      >
                        查看详情
                      </Link>
                      <Button
                        size="sm"
                        variant={added.has(school.id) ? 'secondary' : 'primary'}
                        onClick={() => onAdd(school, cat)}
                        disabled={added.has(school.id)}
                        className="text-xs"
                      >
                        <Plus size={11} />
                        {added.has(school.id) ? '已添加' : '申请'}
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
