import { useState } from 'react'
import type { Experience } from '@/types'
import { X } from 'lucide-react'

const TYPES = ['实习', '科研', '竞赛', '论文', '项目', '志愿者', '社团', '其他']
const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

interface Props {
  experience?: Experience
  onSave: (data: Omit<Experience, 'id' | 'user_id' | 'created_at'>, id?: string) => Promise<void>
  onClose: () => void
}

export default function ExperienceModal({ experience, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    type: experience?.type || '实习',
    title: experience?.title || '',
    organization: experience?.organization || '',
    role: experience?.role || '',
    start_date: experience?.start_date || '',
    end_date: experience?.end_date || '',
    description: experience?.description || '',
    achievements: (experience?.achievements || []).join('\n'),
    skills: (experience?.skills || []).join('、'),
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await onSave({
        type: form.type,
        title: form.title,
        organization: form.organization || null,
        role: form.role || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        description: form.description || null,
        achievements: form.achievements ? form.achievements.split('\n').map(s => s.trim()).filter(Boolean) : null,
        skills: form.skills ? form.skills.split(/[,，、]/).map(s => s.trim()).filter(Boolean) : null,
      }, experience?.id)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">{experience ? '编辑经历' : '添加经历'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
            <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
            <input className={inputCls} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="如：腾讯暑期实习" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">机构/单位</label>
            <input className={inputCls} value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} placeholder="如：腾讯公司" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">职位/角色</label>
            <input className={inputCls} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="如：软件工程师实习生" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
              <input className={inputCls} value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} placeholder="2024-06" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
              <input className={inputCls} value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} placeholder="2024-09 或 present" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea className={inputCls} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="简要描述工作内容..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">成就 (每行一条)</label>
            <textarea className={inputCls} rows={3} value={form.achievements} onChange={e => setForm(f => ({ ...f, achievements: e.target.value }))} placeholder="如：独立完成XXX功能开发" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">技能 (逗号分隔)</label>
            <input className={inputCls} value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} placeholder="如：Python、React、数据分析" />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">取消</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
