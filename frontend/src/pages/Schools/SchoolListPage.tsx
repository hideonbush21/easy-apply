import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSchools } from '@/api/schools'
import type { School, PaginatedResponse } from '@/types'
import { Search } from 'lucide-react'
import { Table } from '@/components/ui/Table'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Input'

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
    <div className="p-8" style={{ animation: 'fade-in 0.3s ease-out' }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">学校库</h2>
        <p className="text-slate-500 text-sm mt-1">共收录 100 所知名院校</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Select
          value={country}
          onChange={e => { setCountry(e.target.value); setPage(1) }}
          className="w-36"
        >
          {COUNTRIES.map(c => <option key={c} value={c}>{c || '全部国家'}</option>)}
        </Select>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="number"
            value={rankingMax}
            onChange={e => { setRankingMax(e.target.value); setPage(1) }}
            placeholder="排名前 N"
            className="pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm w-32 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
          <Spinner size="md" />
          <span className="text-sm">加载中...</span>
        </div>
      ) : (
        <>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head className="w-20">排名</Table.Head>
                <Table.Head>学校</Table.Head>
                <Table.Head className="w-20">国家</Table.Head>
                <Table.Head className="w-24 whitespace-nowrap">GPA 要求</Table.Head>
                <Table.Head className="w-28 whitespace-nowrap">截止日期</Table.Head>
                <Table.Head className="w-16"></Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data?.schools.map(school => (
                <Table.Row key={school.id}>
                  <Table.Cell className="text-slate-400 tabular-nums font-mono text-xs">
                    #{school.ranking}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="font-medium text-slate-900">{school.name_cn || school.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{school.name}</div>
                  </Table.Cell>
                  <Table.Cell className="text-slate-600">{school.country}</Table.Cell>
                  <Table.Cell className="text-slate-600 tabular-nums whitespace-nowrap">
                    {school.gpa_requirement.min} / {school.gpa_requirement.preferred}
                  </Table.Cell>
                  <Table.Cell className="text-slate-600 tabular-nums whitespace-nowrap">
                    {school.application_deadline || '-'}
                  </Table.Cell>
                  <Table.Cell>
                    <Link
                      to={`/schools/${school.id}`}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      详情
                    </Link>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          {data && (
            <Pagination
              page={page}
              pages={data.pages}
              total={data.total}
              onPageChange={setPage}
              className="mt-5"
            />
          )}
        </>
      )}
    </div>
  )
}
