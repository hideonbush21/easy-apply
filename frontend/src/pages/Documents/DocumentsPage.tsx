import { useEffect, useState, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { getAllDocuments, updateDocument } from '@/api/documents'
import type { DocumentGroup } from '@/api/documents'
import { generateSop } from '@/api/sop'
import { generateRecommendation } from '@/api/recommendations'
import type { RecommendationContext } from '@/api/recommendations'
import type { Application } from '@/types'
import { Tabs } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import RichTextEditor from '@/components/RichTextEditor'
import {
  BookOpen,
  Save,
  FileDown,
  FileText,
  Sparkles,
  Check,
  GraduationCap,
  X,
} from 'lucide-react'
import html2pdf from 'html2pdf.js'
import DOMPurify from 'dompurify'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { saveAs } from 'file-saver'

// ── 推荐信引导问答 Modal ───────────────────────────────────────────
const RECOMMENDER_TYPES = [
  { value: '学术导师 / 课程教授', label: '学术导师 / 课程教授' },
  { value: '科研导师', label: '科研导师' },
  { value: '实习 / 工作主管', label: '实习 / 工作主管' },
  { value: '高中老师', label: '高中老师' },
  { value: '其他', label: '其他' },
]

function RecommendationContextModal({
  onConfirm,
  onSkip,
  onClose,
}: {
  onConfirm: (ctx: RecommendationContext) => void
  onSkip: () => void
  onClose: () => void
}) {
  const [form, setForm] = useState<RecommendationContext>({
    recommender_type: '',
    relationship_context: '',
    key_incident: '',
    quantified_outcome: '',
  })
  const [customRecommenderType, setCustomRecommenderType] = useState('')

  const set = (k: keyof RecommendationContext, v: string) =>
    setForm(f => ({ ...f, [k]: v }))

  // 提交时，若选了"其他"则用自定义文本替换
  const buildFinalContext = (): RecommendationContext => ({
    ...form,
    recommender_type: form.recommender_type === '其他' && customRecommenderType.trim()
      ? customRecommenderType.trim()
      : form.recommender_type,
  })

  const inputCls = 'w-full rounded-xl border border-gray-200 bg-white text-sm text-gray-900 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all'
  const labelCls = 'block text-sm font-medium mb-1.5 text-gray-700'

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#1dd3b0,#10b981)', padding: '20px 24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={18} color="white" />
              </div>
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: 0 }}>生成高质量推荐信</p>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, margin: 0 }}>提供推荐人信息，AI 将生成更真实的推荐信</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={15} color="white" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Q1 */}
          <div>
            <label className={labelCls}>
              <span style={{ color: '#1dd3b0', fontWeight: 700, marginRight: 6 }}>Q1</span>
              这封推荐信由谁来写？
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {RECOMMENDER_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => set('recommender_type', t.value)}
                  style={{
                    padding: '5px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
                    background: form.recommender_type === t.value ? '#1dd3b0' : '#f9fafb',
                    color: form.recommender_type === t.value ? '#fff' : '#374151',
                    border: form.recommender_type === t.value ? '1.5px solid #1dd3b0' : '1.5px solid #e5e7eb',
                    fontWeight: form.recommender_type === t.value ? 600 : 400,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {form.recommender_type === '其他' && (
              <input
                className={inputCls}
                style={{ marginTop: 10 }}
                value={customRecommenderType}
                onChange={e => setCustomRecommenderType(e.target.value)}
                placeholder="请说明推荐人身份，如：社区志愿项目负责人 / 竞赛指导老师"
                autoFocus
              />
            )}
          </div>

          {/* Q2 */}
          <div>
            <label className={labelCls}>
              <span style={{ color: '#1dd3b0', fontWeight: 700, marginRight: 6 }}>Q2</span>
              推荐人在什么场景下认识你的？
            </label>
            <input
              className={inputCls}
              value={form.relationship_context}
              onChange={e => set('relationship_context', e.target.value)}
              placeholder="如：大三上学期的计量经济学课程 / 2023年暑期在普华永道的实习项目"
            />
          </div>

          {/* Q3 */}
          <div>
            <label className={labelCls}>
              <span style={{ color: '#1dd3b0', fontWeight: 700, marginRight: 6 }}>Q3</span>
              有没有一件推荐人亲眼目睹、印象深刻的事？
            </label>
            <textarea
              className={inputCls}
              rows={3}
              value={form.key_incident}
              onChange={e => set('key_incident', e.target.value)}
              placeholder="如：我在期末项目中独立发现了数据集的系统性偏差，并在两天内重新建模，最终结论被用于正式报告"
              style={{ resize: 'none' }}
            />
          </div>

          {/* Q4 */}
          <div>
            <label className={labelCls}>
              <span style={{ color: '#1dd3b0', fontWeight: 700, marginRight: 6 }}>Q4</span>
              这段经历中有什么可以量化的成果？
            </label>
            <input
              className={inputCls}
              value={form.quantified_outcome}
              onChange={e => set('quantified_outcome', e.target.value)}
              placeholder="如：获得A+，全班最高分 / 团队竞赛全国第二 / 论文发表于核心期刊"
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #f3f4f6' }}>
          <button
            onClick={onSkip}
            style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#6b7280', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
          >
            跳过，直接生成
          </button>
          <button
            onClick={() => onConfirm(buildFinalContext())}
            style={{ padding: '9px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1dd3b0,#10b981)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(29,211,176,0.3)' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} />
              开始生成
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

const TABS = [
  { key: 'sop', label: '申请信 (SoP)' },
  { key: 'recommendation', label: '推荐信' },
]

export default function DocumentsPage() {
  const location = useLocation()
  const pendingApp = (location.state as { application?: Application } | null)?.application

  const [documents, setDocuments] = useState<DocumentGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppId, setSelectedAppId] = useState('')
  const [activeTab, setActiveTab] = useState<'sop' | 'recommendation'>('sop')
  const [editorContent, setEditorContent] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [toast, setToast] = useState('')
  const [showRLModal, setShowRLModal] = useState(false)
  const originalContentRef = useRef('')

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const res = await getAllDocuments()
      const docs = res.data.documents

      // If navigated from ApplicationListPage with a specific app, select it.
      // If that app has no letters yet, inject a virtual entry so the sidebar shows it.
      if (pendingApp?.id && !selectedAppId) {
        const found = docs.find(d => d.application_id === pendingApp.id)
        if (found) {
          setDocuments(docs)
          setSelectedAppId(pendingApp.id)
        } else {
          // App has no letters yet — add a virtual entry at the top
          const virtual: DocumentGroup = {
            application_id: pendingApp.id,
            school_name: pendingApp.school_name || null,
            school_name_cn: pendingApp.school_name_cn || null,
            program_name_cn: pendingApp.program_name_cn || pendingApp.major || null,
            program_name_en: pendingApp.program_name_en || null,
            sop: null,
            recommendation: null,
          }
          setDocuments([virtual, ...docs])
          setSelectedAppId(pendingApp.id)
        }
      } else {
        setDocuments(docs)
        if (docs.length > 0 && !selectedAppId) {
          setSelectedAppId(docs[0].application_id)
        }
      }
    } catch {
      // handle error silently
    } finally {
      setLoading(false)
    }
  }

  // Current selected document group
  const selectedDoc = documents.find(d => d.application_id === selectedAppId)
  const currentLetter = selectedDoc?.[activeTab] ?? null

  // Sync editor content when selection changes
  useEffect(() => {
    const content = currentLetter?.content || ''
    setEditorContent(content)
    originalContentRef.current = content
    setIsDirty(false)
  }, [selectedAppId, activeTab, currentLetter?.id])

  const handleEditorChange = useCallback((html: string) => {
    setEditorContent(html)
    setIsDirty(html !== originalContentRef.current)
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  // Confirm dialog for unsaved changes
  const confirmSwitch = (): boolean => {
    if (!isDirty) return true
    return window.confirm('当前文书有未保存的修改，确定要切换吗？')
  }

  const handleSelectApp = (appId: string) => {
    if (!confirmSwitch()) return
    setSelectedAppId(appId)
  }

  const handleTabChange = (key: string) => {
    if (!confirmSwitch()) return
    setActiveTab(key as 'sop' | 'recommendation')
  }

  // Save
  const handleSave = async () => {
    if (!currentLetter || !isDirty) return
    setSaving(true)
    try {
      await updateDocument(activeTab, currentLetter.id, editorContent)
      originalContentRef.current = editorContent
      setIsDirty(false)
      // Update local state
      setDocuments(prev =>
        prev.map(d =>
          d.application_id === selectedAppId
            ? { ...d, [activeTab]: { ...d[activeTab]!, content: editorContent, updated_at: new Date().toISOString() } }
            : d
        )
      )
      showToast('保存成功')
    } catch {
      showToast('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  // Generate
  const handleGenerate = () => {
    if (!selectedAppId) return
    if (activeTab === 'recommendation') {
      setShowRLModal(true)  // 推荐信：先弹问答 modal
    } else {
      doGenerate()          // SoP：直接生成
    }
  }

  const doGenerate = async (ctx?: RecommendationContext) => {
    if (!selectedAppId) return
    setGenerating(true)
    try {
      if (activeTab === 'sop') {
        await generateSop(selectedAppId)
      } else {
        await generateRecommendation(selectedAppId, ctx)
      }
      await fetchDocuments()
      window.dispatchEvent(new Event('documents-updated'))
      showToast('文书生成成功')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      showToast(e.response?.data?.error || '生成失败，请检查配置')
    } finally {
      setGenerating(false)
    }
  }

  // Export PDF
  const exportPdf = () => {
    const element = document.createElement('div')
    element.innerHTML = DOMPurify.sanitize(editorContent)
    element.style.padding = '40px'
    element.style.fontFamily = 'serif'
    element.style.fontSize = '12pt'
    element.style.lineHeight = '1.8'
    element.style.color = '#000'

    const schoolName = selectedDoc?.school_name_cn || selectedDoc?.school_name || '文书'
    html2pdf().set({
      margin: [20, 20, 20, 20],
      filename: `${activeTab === 'sop' ? 'SoP' : '推荐信'}_${schoolName}_${new Date().toLocaleDateString('zh-CN')}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4' },
    }).from(element).save()
  }

  // Export Word
  const exportDocx = async () => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = DOMPurify.sanitize(editorContent)
    const paragraphs = Array.from(tempDiv.querySelectorAll('p, h1, h2, h3, li, blockquote'))
      .map(el => new Paragraph({
        children: [new TextRun({ text: el.textContent || '', size: 24 })],
        spacing: { after: 200 },
      }))

    const doc = new Document({
      sections: [{
        children: paragraphs.length > 0
          ? paragraphs
          : [new Paragraph({ children: [new TextRun(tempDiv.textContent || '')] })],
      }],
    })
    const blob = await Packer.toBlob(doc)
    const schoolName = selectedDoc?.school_name_cn || selectedDoc?.school_name || '文书'
    saveAs(blob, `${activeTab === 'sop' ? 'SoP' : '推荐信'}_${schoolName}_${new Date().toLocaleDateString('zh-CN')}.docx`)
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2" style={{ color: '#9ca3af' }}>
        <Spinner /> <span className="text-sm">加载中...</span>
      </div>
    )
  }

  // No documents at all
  if (documents.length === 0) {
    return (
      <div className="p-8" style={{ animation: 'fade-in 0.3s ease-out' }}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold" style={{ color: '#0a0a0a', fontFamily: 'var(--font-display)' }}>我的文书</h2>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>管理和编辑你的留学文书</p>
        </div>
        <EmptyState
          icon={<BookOpen size={20} style={{ color: '#9ca3af' }} />}
          title="暂无文书"
          description="请先在申请管理中生成文书"
        />
      </div>
    )
  }

  return (
    <div className="flex h-screen" style={{ animation: 'fade-in 0.3s ease-out' }}>
      {/* 推荐信引导问答 Modal */}
      {showRLModal && (
        <RecommendationContextModal
          onConfirm={(ctx) => { setShowRLModal(false); doGenerate(ctx) }}
          onSkip={() => { setShowRLModal(false); doGenerate() }}
          onClose={() => setShowRLModal(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #1dd3b0 0%, #10b981 100%)',
            color: 'white',
            animation: 'fade-in 0.25s ease-out',
          }}
        >
          <Check size={16} />
          {toast}
        </div>
      )}

      {/* Left sidebar - Program list */}
      <aside
        className="w-72 shrink-0 flex flex-col overflow-y-auto"
        style={{ borderRight: '1px solid #e5e7eb', background: 'rgba(255,255,255,0.6)' }}
      >
        <div className="px-5 py-5" style={{ borderBottom: '1px solid #e5e7eb' }}>
          <h2 className="text-lg font-bold" style={{ color: '#0a0a0a', fontFamily: 'var(--font-display)' }}>我的文书</h2>
          <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{documents.length} 个申请项目</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {documents.map(doc => {
            const isActive = doc.application_id === selectedAppId
            const schoolName = doc.school_name_cn || doc.school_name || '未知学校'
            const programName = doc.program_name_cn || doc.program_name_en || ''
            const hasSop = !!doc.sop
            const hasRec = !!doc.recommendation

            return (
              <button
                key={doc.application_id}
                onClick={() => handleSelectApp(doc.application_id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-150 cursor-pointer ${
                  isActive ? 'text-white' : 'hover:bg-gray-50'
                }`}
                style={isActive ? {
                  background: 'linear-gradient(135deg, #1dd3b0 0%, #10b981 100%)',
                  boxShadow: '0 4px 12px rgba(29,211,176,0.3)',
                } : {}}
              >
                <div className="flex items-center gap-2.5">
                  <GraduationCap size={16} className={isActive ? 'text-white/80' : ''} style={!isActive ? { color: '#9ca3af' } : {}} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : ''}`}
                       style={!isActive ? { color: '#1f2937' } : {}}>
                      {schoolName}
                    </p>
                    {programName && (
                      <p className={`text-xs truncate mt-0.5 ${isActive ? 'text-white/70' : ''}`}
                         style={!isActive ? { color: '#9ca3af' } : {}}>
                        {programName}
                      </p>
                    )}
                  </div>
                </div>
                {/* Letter indicators */}
                <div className="flex items-center gap-2 mt-2 ml-6">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                    style={isActive
                      ? { background: 'rgba(255,255,255,0.2)', color: 'white' }
                      : hasSop
                        ? { background: '#e6faf6', color: '#0d9e72' }
                        : { background: '#f3f4f6', color: '#9ca3af' }
                    }
                  >
                    SoP {hasSop ? '✓' : '—'}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                    style={isActive
                      ? { background: 'rgba(255,255,255,0.2)', color: 'white' }
                      : hasRec
                        ? { background: '#e6faf6', color: '#0d9e72' }
                        : { background: '#f3f4f6', color: '#9ca3af' }
                    }
                  >
                    推荐信 {hasRec ? '✓' : '—'}
                  </span>
                </div>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Right panel - Editor */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div>
            <h3 className="text-base font-semibold" style={{ color: '#0a0a0a', fontFamily: 'var(--font-display)' }}>
              {selectedDoc?.school_name_cn || selectedDoc?.school_name || ''}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              {selectedDoc?.program_name_cn || selectedDoc?.program_name_en || ''}
            </p>
          </div>
          <Tabs tabs={TABS} active={activeTab} onChange={handleTabChange} />
        </div>

        {/* Content area */}
        <div className="flex-1 p-6 overflow-y-auto" style={{ background: '#f8fdfb' }}>
          {currentLetter ? (
            <>
              <RichTextEditor
                content={currentLetter.content}
                onChange={handleEditorChange}
                editable
              />

              {/* Bottom toolbar */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2 text-xs" style={{ color: '#9ca3af' }}>
                  {currentLetter.updated_at ? (
                    <span>上次修改: {new Date(currentLetter.updated_at).toLocaleString('zh-CN')}</span>
                  ) : (
                    <span>创建于: {new Date(currentLetter.created_at).toLocaleString('zh-CN')}</span>
                  )}
                  {isDirty && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ background: '#fef3c7', color: '#b45309' }}>
                      未保存
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={exportPdf}
                  >
                    <FileDown size={14} />
                    导出 PDF
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={exportDocx}
                  >
                    <FileText size={14} />
                    导出 Word
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    disabled={!isDirty}
                    loading={saving}
                  >
                    <Save size={14} />
                    确认修改
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="glass flex flex-col items-center justify-center py-20 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: '#e6faf6', border: '1px solid rgba(29,211,176,0.2)' }}
              >
                {activeTab === 'sop'
                  ? <FileText size={24} style={{ color: '#10b981' }} />
                  : <BookOpen size={24} style={{ color: '#10b981' }} />
                }
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: '#374151' }}>
                暂无{activeTab === 'sop' ? '申请信' : '推荐信'}
              </p>
              <p className="text-xs mb-5" style={{ color: '#9ca3af' }}>
                点击下方按钮使用 AI 为此申请生成{activeTab === 'sop' ? '申请信 (SoP)' : '推荐信'}
              </p>
              <Button
                variant="primary"
                onClick={handleGenerate}
                loading={generating}
              >
                <Sparkles size={16} />
                {generating ? 'AI 生成中...' : `生成${activeTab === 'sop' ? '申请信' : '推荐信'}`}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
