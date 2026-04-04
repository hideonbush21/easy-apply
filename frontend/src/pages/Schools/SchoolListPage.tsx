import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSchools } from '@/api/schools'
import type { School, PaginatedResponse } from '@/types'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

const COUNTRIES = ['', '英国', '美国', '澳大利亚']

export default function SchoolListPage() {
  const [data, setData] = useState<PaginatedResponse<School> | null>(null)
  const [page, setPage] = useState(1)
  const [country, setCountry] = useState('')
  const [rankingMax, setRankingMax] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getSchools({
      country: country || undefined,
      ranking_max: rankingMax ? Number(rankingMax) : undefined,
      page,
      per_page: 20,
    })
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [country, rankingMax, page])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">学校库</h2>
        <p className="text-gray-500 text-sm mt-1">共收录 100 所知名院校</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={country}
          onChange={e => { setCountry(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {COUNTRIES.map(c => <option key={c} value={c}>{c || '全部国家'}</option>)}
        </select>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="number"
            value={rankingMax}
            onChange={e => { setRankingMax(e.target.value); setPage(1) }}
            placeholder="排名前 N"
            className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">排名</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">学校</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">国家</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">GPA要求</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">截止日期</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.schools.map(school => (
                  <tr key={school.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">#{school.ranking}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{school.name_cn || school.name}</div>
                      <div className="text-xs text-gray-400">{school.name}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{school.country}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {school.gpa_requirement.min} / {school.gpa_requirement.preferred}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{school.application_deadline || '-'}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/schools/${school.id}`}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        详情
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-600">
                第 {page} / {data.pages} 页 (共 {data.total} 所)
              </span>
              <button
                disabled={page >= data.pages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
