import { useState } from 'react'
import type { Experience } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'

const TYPES = ['实习', '科研', '竞赛', '论文', '项目', '志愿者', '社团', '其他']

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
    <Modal
      open
      onClose={onClose}
      title={experience ? '编辑经历' : '添加经历'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} loading={saving} disabled={!form.title.trim()}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          label="类型"
          value={form.type}
          onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
        >
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </Select>
        <Input
          label="标题 *"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="如：腾讯暑期实习"
          required
        />
        <Input
          label="机构/单位"
          value={form.organization}
          onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
          placeholder="如：腾讯公司"
        />
        <Input
          label="职位/角色"
          value={form.role}
          onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
          placeholder="如：软件工程师实习生"
        />
        <div className="flex gap-4">
          <Input
            label="开始时间"
            value={form.start_date}
            onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
            placeholder="2024-06"
            className="flex-1"
          />
          <Input
            label="结束时间"
            value={form.end_date}
            onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
            placeholder="2024-09 或 present"
            className="flex-1"
          />
        </div>
        <Textarea
          label="描述"
          rows={3}
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="简要描述工作内容..."
        />
        <Textarea
          label="成就 (每行一条)"
          rows={3}
          value={form.achievements}
          onChange={e => setForm(f => ({ ...f, achievements: e.target.value }))}
          placeholder="如：独立完成XXX功能开发"
        />
        <Input
          label="技能 (逗号分隔)"
          value={form.skills}
          onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
          placeholder="如：Python、React、数据分析"
        />
      </div>
    </Modal>
  )
}
