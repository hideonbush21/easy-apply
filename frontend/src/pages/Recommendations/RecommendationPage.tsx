import { useEffect, useState } from 'react'
import { getApplications } from '@/api/applications'
import { generateRecommendation, getRecommendation } from '@/api/recommendations'
import type { Application, RecommendationLetter } from '@/types'
import { Sparkles, Download, ChevronDown } from 'lucide-react'

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
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">推荐信生成</h2>
        <p className="text-gray-500 text-sm mt-1">使用 AI 根据你的背景生成个性化推荐信</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">选择申请</label>
          <div className="relative">
            <select
              value={selectedAppId}
              onChange={e => handleSelectApp(e.target.value)}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="">-- 请选择一个申请 --</option>
              {applications.map(app => (
                <option key={app.id} value={app.id}>
                  {app.school?.name_cn || app.school?.name} · {app.major || '未指定专业'}
                </option>
              ))}
            </select>
            <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {selectedApp && (
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 mb-4">
            <span>{selectedApp.school?.name_cn || selectedApp.school?.name}</span>
            <span>·</span>
            <span>{selectedApp.major || '未指定专业'}</span>
            <span>·</span>
            <span className="text-gray-400">{selectedApp.school?.country}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!selectedAppId || generating}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Sparkles size={16} />
          {generating ? 'AI 生成中...' : letter ? '重新生成' : '生成推荐信'}
        </button>
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-400">加载中...</div>
      )}

      {letter && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900">推荐信内容</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">生成于 {new Date(letter.created_at).toLocaleString('zh-CN')}</span>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Download size={14} /> 导出文本
              </button>
            </div>
          </div>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed bg-gray-50 rounded-lg p-4">
              {letter.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
