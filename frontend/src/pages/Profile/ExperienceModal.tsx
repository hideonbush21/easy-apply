import { useState } from 'react'
import type { Experience } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'

const EXP_TYPE_MAP: Record<string, string> = {
  '教育背景': 'education',
  '学术背景': 'academic',
  '职业经历': 'professional',
  '课外经历': 'extracurricular',
}

const MODAL_TITLE: Record<string, string> = {
  '教育背景': '编辑教育背景',
  '学术背景': '编辑学术/课程经历',
  '职业经历': '编辑职业与实习经历',
  '课外经历': '编辑课外活动',
}

const IMPORTANCE_OPTIONS = ['非常重要', '重要', '一般']

const DEGREE_LEVEL_OPTIONS = ['高中', '本科', '硕士', '博士', '专科', '其他']

const RELATED_DEGREE_OPTIONS = ['高中', '本科', '硕士', '博士', '专科', '其他']

const WORK_TYPE_OPTIONS = ['全职', '兼职', '实习', '创业', '自由职业', '其他']

type FormState = {
  // 通用
  importance: string
  // 教育背景
  country: string
  degree_level: string
  organization: string  // 院校名称
  degree_name: string
  major: string
  gpa_info: string
  other_info: string
  // 学术背景
  title: string         // 课程名称 / 活动名称
  related_degree: string
  description: string   // 具体经历
  subjective_description: string
  // 职业经历
  role: string          // 职位名称
  work_type: string
  // 时间（教育/职业复用）
  start_date: string
  end_date: string
}

function initForm(exp?: Experience): FormState {
  return {
    importance: exp?.importance || '',
    country: exp?.country || '',
    degree_level: exp?.degree_level || '',
    organization: exp?.organization || '',
    degree_name: exp?.degree_name || '',
    major: exp?.major || '',
    gpa_info: exp?.gpa_info || '',
    other_info: exp?.other_info || '',
    title: exp?.title || '',
    related_degree: exp?.related_degree || '',
    description: exp?.description || '',
    subjective_description: exp?.subjective_description || '',
    role: exp?.role || '',
    work_type: exp?.work_type || '',
    start_date: exp?.start_date || '',
    end_date: exp?.end_date || '',
  }
}

interface Props {
  category: string
  experience?: Experience
  onSave: (data: Omit<Experience, 'id' | 'user_id' | 'created_at'>, id?: string) => Promise<void>
  onClose: () => void
}

export default function ExperienceModal({ category, experience, onSave, onClose }: Props) {
  const [form, setForm] = useState<FormState>(initForm(experience))
  const [saving, setSaving] = useState(false)

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const isValid = () => {
    if (category === '教育背景') return !!form.organization.trim()
    return !!form.title.trim()
  }

  const handleSave = async () => {
    if (!isValid()) return
    setSaving(true)
    const expType = EXP_TYPE_MAP[category] || category
    try {
      const payload: Omit<Experience, 'id' | 'user_id' | 'created_at'> = {
        type: expType,
        title: category === '教育背景' ? (form.organization || '—') : form.title,
        organization: form.organization || null,
        role: form.role || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        description: form.description || null,
        achievements: null,
        skills: null,
        importance: form.importance || null,
        country: form.country || null,
        degree_level: form.degree_level || null,
        degree_name: form.degree_name || null,
        major: form.major || null,
        gpa_info: form.gpa_info || null,
        other_info: form.other_info || null,
        related_degree: form.related_degree || null,
        subjective_description: form.subjective_description || null,
        work_type: form.work_type || null,
      }
      await onSave(payload, experience?.id)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={experience ? MODAL_TITLE[category] : MODAL_TITLE[category]?.replace('编辑', '新增')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} loading={saving} disabled={!isValid()}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">

        {/* ── 教育背景 ── */}
        {category === '教育背景' && (
          <>
            <p className="text-xs font-medium" style={{ color: '#9ca3af' }}>请您向我们介绍您的教育背景</p>
            <Select label="您的学历" value={form.degree_level} onChange={set('degree_level')}>
              <option value="">请输入您的学历</option>
              {DEGREE_LEVEL_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </Select>
            <Input label="您的院校所在国家" value={form.country} onChange={set('country')} placeholder="如：中国、美国" />
            <Input label="您的院校 *" value={form.organization} onChange={set('organization')} placeholder="请输入院校" required />
            <Input label="您的学位" value={form.degree_name} onChange={set('degree_name')} placeholder="请输入您的学位" />
            <Input label="您的专业" value={form.major} onChange={set('major')} placeholder="请输入您的专业" />
            <Input label="您的成绩" value={form.gpa_info} onChange={set('gpa_info')} placeholder="请输入您的成绩" />
            <div className="flex gap-4">
              <Input label="开始时间" value={form.start_date} onChange={set('start_date')} placeholder="2020-09" className="flex-1" />
              <Input label="结束时间" value={form.end_date} onChange={set('end_date')} placeholder="2024-06" className="flex-1" />
            </div>
            <Textarea label="关于您本院校的其他信息" rows={3} value={form.other_info} onChange={set('other_info')} placeholder="如荣誉、奖项、特殊项目等…" />
          </>
        )}

        {/* ── 学术背景 ── */}
        {category === '学术背景' && (
          <>
            <p className="text-xs font-medium" style={{ color: '#9ca3af' }}>学术经历 · 专业课程经历和说明</p>
            <Select label="本经历的重要程度" value={form.importance} onChange={set('importance')}>
              <option value="">请选择经历的重要程度</option>
              {IMPORTANCE_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </Select>
            <Input label="您的课程名称 *" value={form.title} onChange={set('title')} placeholder="如：机器学习" required />
            <Select label="相关学历" value={form.related_degree} onChange={set('related_degree')}>
              <option value="">请选择您的学历</option>
              {RELATED_DEGREE_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </Select>
            <Textarea label="具体课程经历" rows={4} value={form.description} onChange={set('description')} placeholder="描述课程内容、项目、成果等…" />
            <Textarea label="主观性描述" rows={3} value={form.subjective_description} onChange={set('subjective_description')} placeholder="您的个人感受、收获、对申请的意义…" />
          </>
        )}

        {/* ── 职业经历 ── */}
        {category === '职业经历' && (
          <>
            <p className="text-xs font-medium" style={{ color: '#9ca3af' }}>专业与职业经历 · 全职工作/创业经历和说明</p>
            <Select label="本经历的重要程度" value={form.importance} onChange={set('importance')}>
              <option value="">请选择经历的重要程度</option>
              {IMPORTANCE_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </Select>
            <Input label="您的公司名称 *" value={form.organization} onChange={set('organization')} placeholder="如：字节跳动" required />
            <Input label="您的职位名称" value={form.role} onChange={set('role')} placeholder="如：软件工程师" />
            <Select label="工作类型" value={form.work_type} onChange={set('work_type')}>
              <option value="">请选择工作类型</option>
              {WORK_TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </Select>
            <div className="flex gap-4">
              <Input label="开始时间" value={form.start_date} onChange={set('start_date')} placeholder="2023-07" className="flex-1" />
              <Input label="结束时间" value={form.end_date} onChange={set('end_date')} placeholder="2024-01 或 present" className="flex-1" />
            </div>
            <Textarea label="具体工作经历" rows={4} value={form.description} onChange={set('description')} placeholder="描述工作职责、项目、成果…" />
            <Textarea label="主观性描述" rows={3} value={form.subjective_description} onChange={set('subjective_description')} placeholder="您的个人成长、收获、对申请的意义…" />
          </>
        )}

        {/* ── 课外经历 ── */}
        {category === '课外经历' && (
          <>
            <p className="text-xs font-medium" style={{ color: '#9ca3af' }}>课外活动经历和说明</p>
            <Select label="本经历的重要程度" value={form.importance} onChange={set('importance')}>
              <option value="">请选择经历的重要程度</option>
              {IMPORTANCE_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </Select>
            <Input label="课外活动名称/所参与社团组织 *" value={form.title} onChange={set('title')} placeholder="如：学生会主席、志愿者协会" required />
            <Select label="相关学历" value={form.related_degree} onChange={set('related_degree')}>
              <option value="">请选择您的学历</option>
              {RELATED_DEGREE_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </Select>
            <div className="flex gap-4">
              <Input label="开始时间" value={form.start_date} onChange={set('start_date')} placeholder="2022-09" className="flex-1" />
              <Input label="结束时间" value={form.end_date} onChange={set('end_date')} placeholder="2024-06 或 present" className="flex-1" />
            </div>
            <Textarea label="具体课外活动经历" rows={4} value={form.description} onChange={set('description')} placeholder="描述活动内容、担任职责、取得成果…" />
            <Textarea label="主观性描述" rows={3} value={form.subjective_description} onChange={set('subjective_description')} placeholder="您的个人感受、收获、对申请的意义…" />
          </>
        )}

      </div>
    </Modal>
  )
}
