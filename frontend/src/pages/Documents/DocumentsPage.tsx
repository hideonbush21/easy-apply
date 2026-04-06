import { useEffect, useState } from 'react'
import { getApplications } from '@/api/applications'
import { generateRecommendation, getRecommendation } from '@/api/recommendations'
import { generateSop, getSop } from '@/api/sop'
import type { Application, RecommendationLetter, SopLetter } from '@/types'
import { Sparkles, Download } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { Tabs } from '@/components/ui/Tabs'

const TABS = [
  { key: 'recommendation', label: '推荐信' },
  { key: 'sop', label: '申请信 (SoP)' },
]

function LetterPanel({
  applications,
  type,
}: {
  applications: Application[]
  type: 'recommendation' | 'sop'
}) {
  const [selectedAppId, setSelectedAppId] = useState('')
  const [letter, setLetter] = useState<RecommendationLetter | SopLetter | null>(null)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isRec = type === 'recommendation'
  const labels = isRec
    ? { title: '推荐信生成', desc: '使用 AI 根据你的背景生成个性化推荐信', btn: '推荐信', file: '推荐信' }
    : { title: '申请信生成 (SoP)', desc: '使用 AI 根据你的背景生成个性化申请信', btn: '申请信', file: '申请信' }

  const handleSelectApp = async (appId: string) => {
    setSelectedAppId(appId)
    setLetter(null)
    setError('')
    if (!appId) return
    setLoading(true)
    try {
      const res = isRec ? await getRecommendation(appId) : await getSop(appId)
      setLetter(res.data)
    } catch {
      // No existing letter
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedAppId) return
    setGenerating(true)
    setError('')
    try {
      const res = isRec
        ? await generateRecommendation(selectedAppId)
        : await generateSop(selectedAppId)
      setLetter(res.data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || '生成失败，请检查 API Key 配置')
    } finally {
      setGenerating(false)
    }
  }

  const handleExport = () => {
    if (!letter) return
    const selectedApp = applications.find(a => a.id === selectedAppId)
    const filename = `${labels.file}_${selectedApp?.school?.name_cn || '学校'}_${new Date().toLocaleDateString('zh-CN')}.txt`
    const blob = new Blob([letter.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedApp = applications.find(a => a.id === selectedAppId)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">{labels.title}</h2>
        <p className="text-slate-400 text-sm mt-1">{labels.desc}</p>
      </div>

      <Card className="mb-5">
        <Card.Body>
          <Select
            label="选择申请"
            value={selectedAppId}
            onChange={e => handleSelectApp(e.target.value)}
          >
            <option value="">-- 请选择一个申请 --</option>
            {applications.map(app => (
              <option key={app.id} value={app.id}>
                {app.school?.name_cn || app.school?.name} · {app.major || '未指定专业'}
              </option>
            ))}
          </Select>

          {selectedApp && (
            <div className="flex items-center gap-3 mt-3 p-3 bg-white/[0.04] rounded-xl text-sm text-slate-300 border border-white/[0.06]">
              <span className="font-medium text-slate-100">{selectedApp.school?.name_cn || selectedApp.school?.name}</span>
              <span className="text-white/20">·</span>
              <span>{selectedApp.major || '未指定专业'}</span>
              <span className="text-white/20">·</span>
              <span className="text-slate-400">{selectedApp.school?.country}</span>
            </div>
          )}

          {error && (
            <div className="mt-3 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-300">
              {error}
            </div>
          )}

          <div className="mt-4">
            <Button
              variant="accent"
              onClick={handleGenerate}
              disabled={!selectedAppId}
              loading={generating}
            >
              <Sparkles size={16} />
              {generating ? 'AI 生成中...' : letter ? `重新生成${labels.btn}` : `生成${labels.btn}`}
            </Button>
          </div>
        </Card.Body>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
          <Spinner /> <span className="text-sm">加载中...</span>
        </div>
      )}

      {letter && !loading && (
        <Card>
          <Card.Header>
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-white">{labels.btn}内容</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  生成于 {new Date(letter.created_at).toLocaleString('zh-CN')}
                </span>
                <Button variant="secondary" size="sm" onClick={handleExport}>
                  <Download size={14} /> 导出文本
                </Button>
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            <pre
              className="whitespace-pre-wrap text-sm text-slate-200 leading-relaxed bg-white/[0.04] rounded-xl p-5 border border-white/[0.06]"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: '1.7' }}
            >
              {letter.content}
            </pre>
          </Card.Body>
        </Card>
      )}
    </div>
  )
}

export default function DocumentsPage() {
  const [tab, setTab] = useState('recommendation')
  const [applications, setApplications] = useState<Application[]>([])

  useEffect(() => {
    getApplications().then(r => setApplications(r.data))
  }, [])

  return (
    <div className="p-8 max-w-4xl" style={{ animation: 'fade-in 0.3s ease-out' }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">文书生成</h2>
        <p className="text-slate-400 text-sm mt-1">AI 驱动的个性化留学文书生成工具</p>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} className="mb-6" />

      {tab === 'recommendation' && (
        <LetterPanel applications={applications} type="recommendation" />
      )}
      {tab === 'sop' && (
        <LetterPanel applications={applications} type="sop" />
      )}
    </div>
  )
}
