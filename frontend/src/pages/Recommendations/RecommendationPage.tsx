import { useEffect, useState } from 'react'
import { getApplications } from '@/api/applications'
import { generateRecommendation, getRecommendation } from '@/api/recommendations'
import type { Application, RecommendationLetter } from '@/types'
import { Sparkles, Download } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'

export default function RecommendationPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedAppId, setSelectedAppId] = useState('')
  const [letter, setLetter] = useState<RecommendationLetter | null>(null)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getApplications().then(r => setApplications(r.data))
  }, [])

  const handleSelectApp = async (appId: string) => {
    setSelectedAppId(appId)
    setLetter(null)
    setError('')
    if (!appId) return
    setLoading(true)
    try {
      const res = await getRecommendation(appId)
      setLetter(res.data)
    } catch {
      // No existing letter, that's fine
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedAppId) return
    setGenerating(true)
    setError('')
    try {
      const res = await generateRecommendation(selectedAppId)
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
    const filename = `推荐信_${selectedApp?.school?.name_cn || '学校'}_${new Date().toLocaleDateString('zh-CN')}.txt`
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
    <div className="p-8 max-w-4xl" style={{ animation: 'fade-in 0.3s ease-out' }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">推荐信生成</h2>
        <p className="text-slate-500 text-sm mt-1">使用 AI 根据你的背景生成个性化推荐信</p>
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
            <div className="flex items-center gap-3 mt-3 p-3 bg-slate-50 rounded-xl text-sm text-slate-600 border border-slate-100">
              <span className="font-medium text-slate-800">{selectedApp.school?.name_cn || selectedApp.school?.name}</span>
              <span className="text-slate-300">·</span>
              <span>{selectedApp.major || '未指定专业'}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-400">{selectedApp.school?.country}</span>
            </div>
          )}

          {error && (
            <div className="mt-3 px-4 py-3 bg-danger-50 border border-danger-100 rounded-xl text-sm text-danger-600">
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
              {generating ? 'AI 生成中...' : letter ? '重新生成' : '生成推荐信'}
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
              <h3 className="font-semibold text-slate-900">推荐信内容</h3>
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
              className="whitespace-pre-wrap text-sm text-slate-800 leading-relaxed bg-slate-50 rounded-xl p-5 border border-slate-100"
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
