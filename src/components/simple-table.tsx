import { useTable } from 'react-table'

type SimpleTableProps = {
  data: { [key: string]: string | number }[]
  columns: {
    Header: string
    accessor: string
  }[]
}

const SimpleTable = ({ data, columns }: SimpleTableProps) => {
  const tableInstance = useTable({ columns, data })
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance

  return (
    // apply the table props
    <table {...getTableProps()} className="table-auto font-mono text-xs">
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
                  <th {...column.getHeaderProps()} style={{ border: '1px solid black' }}>
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
                      <td {...cell.getCellProps()} style={{ padding: 4, border: '1px solid black' }}>
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

export default SimpleTable
