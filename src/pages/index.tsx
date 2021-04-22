import { NextPage } from 'next'
import useSWR from 'swr'
import { useMemo } from 'react'
import { useTable } from 'react-table'
import Debug from 'debug'
import { format } from 'date-fns'

import { Candle } from '../models'
import { JSONData } from '../types'
import BasicCandleStickChart from '../components'
import { Indicatorer } from 'src/interfaces'

const debug = Debug(`pages:index`)

type IndexProps = {}

const Index: NextPage<IndexProps> = () => {
  const { data, error } = useSWR<JSONData<Candle>>(`api/candles/${'BTC-USD'}?period=${60 * 15}`, (url) =>
    fetch(url).then((res) => res.json())
  )

  const stc = useMemo(
    () => data && Array.isArray(data) && Indicatorer.stc(data.map(({ attributes: { close } }) => close)),
    [data]
  )

  if (error) return <div>Failed to load users</div>
  if (!data) return <div>Loading...</div>

  const btcData =
    stc && Array.isArray(data) && data.map(({ attributes }, i) => ({ ...attributes, stc: stc[i] }))

  return (
    <div>
      {btcData && (
        <>
          <BasicCandleStickChart candles={btcData} />
          <StcTable
            data={btcData.map(({ time, stc }) => ({ time: format(new Date(time), 'h:mm a E MMM d'), stc }))}
            columns={[
              { Header: 'Time', accessor: 'time' },
              { Header: 'stc', accessor: 'stc' },
            ]}
          />
        </>
      )}
    </div>
  )
}

type StcTableProps = {
  data: { [key: string]: string | number }[]
  columns: {
    Header: string
    accessor: string
  }[]
}

const StcTable = ({ data, columns }: StcTableProps) => {
  const tableInstance = useTable({ columns, data })
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance

  return (
    // apply the table props
    <table {...getTableProps()} className="table-auto">
      <thead>
        {
          // Loop over the header rows
          headerGroups.map((headerGroup) => (
            // Apply the header row props
            <tr {...headerGroup.getHeaderGroupProps()}>
              {
                // Loop over the headers in each row
                headerGroup.headers.map((column) => (
                  // Apply the header cell props
                  <th {...column.getHeaderProps()}>
                    {
                      // Render the header
                      column.render('Header')
                    }
                  </th>
                ))
              }
            </tr>
          ))
        }
      </thead>
      {/* Apply the table body props */}
      <tbody {...getTableBodyProps()}>
        {
          // Loop over the table rows
          rows.map((row) => {
            // Prepare the row for display
            prepareRow(row)
            return (
              // Apply the row props
              <tr {...row.getRowProps()}>
                {
                  // Loop over the rows cells
                  row.cells.map((cell) => {
                    // Apply the cell props
                    return (
                      <td {...cell.getCellProps()}>
                        {
                          // Render the cell contents
                          cell.render('Cell')
                        }
                      </td>
                    )
                  })
                }
              </tr>
            )
          })
        }
      </tbody>
    </table>
  )
}

export default Index
