import React from 'react';
import DataTable from './DataTable';
import TableFilters from './TableFilters';

const TableWithFilters = ({
  data,
  columns,
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  onApplyFilters,
  onExport,
  showApplyButton = true,
  showExportButton = true,
  applyButtonText = "Apply Filters",
  exportButtonText = "Export",
  resultsCounter = null,
  className = "",
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Table Header with Filters */}
      <TableFilters
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        onApplyFilters={onApplyFilters}
        onExport={onExport}
        showApplyButton={showApplyButton}
        showExportButton={showExportButton}
        applyButtonText={applyButtonText}
        exportButtonText={exportButtonText}
      />

      {/* Results Counter */}
      {resultsCounter && (
        <div className="">
          {resultsCounter}
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto -mt-px">
        <DataTable
          data={data}
          columns={columns}
          searchable={false} // We have custom search
          filterable={false} // We have custom filters
          exportable={false} // We have custom export
          sortable={true} // Enable sorting
          className="border-0 shadow-none" // Remove extra styling since we're inside a card
        />
      </div>
    </div>
  );
};

export default TableWithFilters;
