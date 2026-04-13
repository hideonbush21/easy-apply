import { useState, useEffect, useRef } from 'react'
import { getAllDocuments } from '@/api/documents'
import { humanizeText } from '@/api/sop'
import type { DocumentGroup } from '@/types'
import { ChevronDown, Copy, Check, Sparkles, FileText, X } from 'lucide-react'

export default function AiDetectionPage() {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // 导入文书
  const [documents, setDocuments] = useState<DocumentGroup[]>([])
  const [showImportMenu, setShowImportMenu] = useState(false)
  const importMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getAllDocuments()
      .then(res => setDocuments(res.data.documents || []))
      .catch(() => {})
  }, [])

  // 点击外部关闭下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (importMenuRef.current && !importMenuRef.current.contains(e.target as Node)) {
        setShowImportMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleImport = (content: string) => {
    setInputText(content)
    setShowImportMenu(false)
    setOutputText('')
    setError('')
  }

  const handleHumanize = async () => {
    if (!inputText.trim()) {
      setError('请输入需要优化的文书内容')
      return
    }
    setError('')
    setLoading(true)
    setOutputText('')
    try {
      const res = await humanizeText(inputText.trim())
      setOutputText(res.data.humanized_content)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || '优化失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!outputText) return
    await navigator.clipboard.writeText(outputText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // 统计有内容的文书
  const importableItems: { label: string; content: string }[] = []
  documents.forEach(doc => {
    const school = doc.school_name_cn || doc.school_name || '未知学校'
    const program = doc.program_name_cn || doc.program_name_en || ''
    const prefix = program ? `${school} · ${program}` : school
    if (doc.sop?.content) {
      importableItems.push({ label: `${prefix} — SoP`, content: doc.sop.content })
    }
    if (doc.recommendation?.content) {
      importableItems.push({ label: `${prefix} — 推荐信`, content: doc.recommendation.content })
    }
  })

  const inputWordCount = inputText.trim() ? inputText.trim().length : 0
  const outputWordCount = outputText.trim() ? outputText.trim().length : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fdfb' }}>

      {/* 顶部标题栏 */}
      <div style={{
        padding: '20px 28px 16px',
        borderBottom: '1px solid #e5e7eb',
        background: 'white',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #1dd3b0, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={18} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0a0a0a', margin: 0 }}>AI 检测破解</h1>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>对 AI 生成的文书进行改写，降低 AI 味，让内容读起来更像真人所写</p>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={{
          margin: '12px 28px 0',
          padding: '10px 14px',
          borderRadius: 10,
          fontSize: 13,
          color: '#dc2626',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          {error}
          <button onClick={() => setError('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626', padding: 0 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* 主内容区：左右分栏 */}
      <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden', padding: '16px 28px 20px' }}>

        {/* 左侧：输入区 */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: 'white', borderRadius: 14, border: '1px solid #e5e7eb',
          marginRight: 12, overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          {/* 左侧头部 */}
          <div style={{
            padding: '14px 16px 12px',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>输入文书</span>

            {/* 从文书导入下拉 */}
            <div style={{ position: 'relative' }} ref={importMenuRef}>
              <button
                onClick={() => setShowImportMenu(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', border: '1.5px solid #1dd3b0',
                  borderRadius: 8, background: 'white', color: '#1dd3b0',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <FileText size={13} />
                从文书导入
                <ChevronDown size={13} style={{ transform: showImportMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>

              {showImportMenu && (
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: 4,
                  width: 320, background: 'white', borderRadius: 10,
                  border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  zIndex: 50, overflow: 'hidden',
                }}>
                  {importableItems.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>
                      暂无可导入的文书
                    </div>
                  ) : (
                    <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                      {importableItems.map((item, i) => (
                        <button
                          key={i}
                          onClick={() => handleImport(item.content)}
                          style={{
                            width: '100%', textAlign: 'left',
                            padding: '10px 14px', border: 'none',
                            background: 'none', cursor: 'pointer',
                            fontSize: 13, color: '#374151',
                            borderBottom: i < importableItems.length - 1 ? '1px solid #f3f4f6' : 'none',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf9')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 文本输入区 */}
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="在此粘贴或输入 AI 生成的文书内容..."
            style={{
              flex: 1, resize: 'none', border: 'none', outline: 'none',
              padding: '14px 16px', fontSize: 14, lineHeight: 1.7,
              color: '#1f2937', fontFamily: 'inherit',
              background: 'transparent',
            }}
          />

          {/* 左侧底部 */}
          <div style={{
            padding: '10px 16px 12px',
            borderTop: '1px solid #f3f4f6',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>
              {inputWordCount > 0 ? `${inputWordCount} 字符` : ''}
            </span>
            <button
              onClick={handleHumanize}
              disabled={loading || !inputText.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 20px', border: 'none', borderRadius: 9,
                background: loading || !inputText.trim()
                  ? '#d1fae5'
                  : 'linear-gradient(135deg, #1dd3b0, #10b981)',
                color: loading || !inputText.trim() ? '#6ee7b7' : 'white',
                fontSize: 14, fontWeight: 600,
                cursor: loading || !inputText.trim() ? 'not-allowed' : 'pointer',
                boxShadow: loading || !inputText.trim() ? 'none' : '0 4px 12px rgba(29,211,176,0.35)',
                transition: 'all 0.2s',
              }}
            >
              <Sparkles size={14} />
              {loading ? '优化中...' : '开始优化'}
            </button>
          </div>
        </div>

        {/* 右侧：输出区 */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: 'white', borderRadius: 14, border: '1px solid #e5e7eb',
          marginLeft: 12, overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          {/* 右侧头部 */}
          <div style={{
            padding: '14px 16px 12px',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>优化结果</span>
            {outputText && (
              <button
                onClick={handleCopy}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', border: '1.5px solid #e5e7eb',
                  borderRadius: 8, background: 'white',
                  color: copied ? '#10b981' : '#6b7280',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? '已复制' : '复制结果'}
              </button>
            )}
          </div>

          {/* 右侧内容 */}
          <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
            {loading ? (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 12,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: '3px solid #d1fae5',
                  borderTopColor: '#1dd3b0',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>AI 正在改写中，请稍候...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : outputText ? (
              <div style={{ padding: '14px 16px' }}>
                <p style={{
                  fontSize: 14, lineHeight: 1.8, color: '#1f2937',
                  whiteSpace: 'pre-wrap', margin: 0,
                }}>
                  {outputText}
                </p>
              </div>
            ) : (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <Sparkles size={32} color="#d1fae5" />
                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>优化结果将显示在这里</p>
              </div>
            )}
          </div>

          {/* 右侧底部 */}
          {outputText && (
            <div style={{
              padding: '10px 16px 12px',
              borderTop: '1px solid #f3f4f6',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>
                {outputWordCount} 字符
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
