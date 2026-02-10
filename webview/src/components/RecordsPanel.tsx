import React, { useState, useMemo } from 'react';
import { Icon, InputGroup, Tag, Section, SectionCard, Button, ButtonGroup, Text, HTMLSelect } from '@blueprintjs/core';
import { Table, Column, Cell, ColumnHeaderCell, RowHeaderCell } from '@blueprintjs/table';

interface RecordsPanelProps {
  records: any[];
  header: string[];
  filteredRecords: any[];
}

export const RecordsPanel: React.FC<RecordsPanelProps> = ({ records, header, filteredRecords }) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const fullyFilteredRecords = useMemo(() => {
    let result = filteredRecords;
    Object.entries(columnFilters).forEach(([col, filterValue]) => {
      if (filterValue.trim()) {
        result = result.filter((row) => String(row[col] ?? '').toLowerCase().includes(filterValue.toLowerCase()));
      }
    });
    return result;
  }, [filteredRecords, columnFilters]);

  React.useEffect(() => { setCurrentPage(1); }, [columnFilters, filteredRecords]);

  const sortedRecords = useMemo(() => {
    if (!sortColumn) return fullyFilteredRecords;
    return [...fullyFilteredRecords].sort((a, b) => {
      const aVal = a[sortColumn] ?? '';
      const bVal = b[sortColumn] ?? '';
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [fullyFilteredRecords, sortColumn, sortDirection]);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedRecords.slice(startIndex, startIndex + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedRecords.length / pageSize);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleColumnFilterChange = (column: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [column]: value }));
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return undefined;
    return sortDirection === 'asc' ? 'caret-up' : 'caret-down';
  };

  const renderCell = (rowIndex: number, columnKey: string) => {
    const value = paginatedRecords[rowIndex]?.[columnKey];
    const isOdd = rowIndex % 2 !== 0;
    return <Cell className={isOdd ? 'odd-row' : ''}>{String(value ?? '')}</Cell>;
  };

  const renderColumnHeader = (columnName: string) => (
    <ColumnHeaderCell name={columnName.toUpperCase()} nameRenderer={(name) => (
      <div className="th-content" onClick={() => handleSort(columnName)}>
        <span>{name}</span>
        {getSortIcon(columnName) && <Icon icon={getSortIcon(columnName)} size={12} />}
      </div>
    )}>
      <div className="filter-container">
        <InputGroup small placeholder={`Filter ${columnName}...`} value={columnFilters[columnName] || ''} onChange={(e) => handleColumnFilterChange(columnName, e.target.value)} />
      </div>
    </ColumnHeaderCell>
  );

  return (
    <Section
      title="Records"
      icon={<Icon icon="th" size={14} />}
      className="panel records-section-container"
      rightElement={
        <div className="header-right-tools">
          <Tag round intent="primary">{sortedRecords.length} / {records.length} records</Tag>
        </div>}
    >
      <SectionCard padded={false} className="panel-card records-section-card">
        <div className="table-wrapper">
          <Table
            numRows={paginatedRecords.length}
            enableRowHeader={true}
            rowHeaderCellRenderer={(rowIndex) => <RowHeaderCell name={String((currentPage - 1) * pageSize + rowIndex + 1)} />}
            cellRendererDependencies={[paginatedRecords, currentPage, pageSize]}
            enableFocusedCell={true}
            defaultRowHeight={30}
            defaultColumnWidth={150}
            minColumnWidth={100}
            enableColumnResizing={true}
          >
            {header.map((h) => <Column key={h} name={h} cellRenderer={(rowIndex) => renderCell(rowIndex, h)} columnHeaderCellRenderer={() => renderColumnHeader(h)} />)}
          </Table>
        </div>
      </SectionCard>
      <div className="panel-footer pagination" style={{ flexShrink: 0 }}>
        <div className="pagination-left">
          <Text className="page-size-label">Page Size</Text>
          <HTMLSelect value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} options={[10, 25, 50, 100, 500]} minimal />
        </div>
        <div className="pagination-center">
          <ButtonGroup minimal>
            <Button icon="double-chevron-left" disabled={currentPage === 1} onClick={() => setCurrentPage(1)} title="First Page">First</Button>
            <Button icon="chevron-left" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} title="Previous Page">Prev</Button>
            <Button active intent="primary">{currentPage}</Button>
            <Button rightIcon="chevron-right" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} title="Next Page">Next</Button>
            <Button rightIcon="double-chevron-right" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(totalPages)} title="Last Page">Last</Button>
          </ButtonGroup>
        </div>
        <div className="pagination-right">
          <Tag className="pagination-total">
            Total: {sortedRecords.length} records ({totalPages} pages)
          </Tag>
          <Tag className="pagination-total-compact">
            {sortedRecords.length}({totalPages})
          </Tag>
        </div>
      </div>
    </Section>
  );
};
