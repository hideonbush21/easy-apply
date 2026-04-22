import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DocumentGroup } from '@/api/documents'

interface SopGeneratingState {
  taskId: string | null
  applicationId: string | null
  tab: 'sop' | 'recommendation' | null
  message: string
  /** Snapshot of the DocumentGroup at generation start — kept so the entry
   *  can be re-injected into the list when the app has no letters yet. */
  virtualEntry: DocumentGroup | null
  setTask: (
    taskId: string,
    applicationId: string,
    tab: 'sop' | 'recommendation',
    virtualEntry: DocumentGroup
  ) => void
  setMessage: (msg: string) => void
  clear: () => void
}

export const useSopGeneratingStore = create<SopGeneratingState>()(
  persist(
    set => ({
      taskId: null,
      applicationId: null,
      tab: null,
      message: '',
      virtualEntry: null,
      setTask: (taskId, applicationId, tab, virtualEntry) =>
        set({ taskId, applicationId, tab, virtualEntry, message: 'AI 生成中…' }),
      setMessage: (message) => set({ message }),
      clear: () => set({ taskId: null, applicationId: null, tab: null, message: '', virtualEntry: null }),
    }),
    {
      name: 'sop-generating',
      storage: {
        getItem: (key) => {
          const v = sessionStorage.getItem(key)
          return v ? JSON.parse(v) : null
        },
        setItem: (key, v) => sessionStorage.setItem(key, JSON.stringify(v)),
        removeItem: (key) => sessionStorage.removeItem(key),
      },
    }
  )
)
