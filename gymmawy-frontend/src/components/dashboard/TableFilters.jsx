import React from 'react';
import { Search, Filter, Download } from 'lucide-react';

const TableFilters = ({
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
  className = "",
}) => {
  return (
    <div className={`p-6 border-b border-gray-200 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Search Input */}
        <div className="md:max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-11 w-full px-4 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary"
            />
          </div>
        </div>

        {/* Dynamic Filters */}
        {filters.map((filter, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{filter.label}</label>
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="w-full px-4 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary"
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-4">
          {showApplyButton && (
            <button
              onClick={onApplyFilters}
              className="flex items-center justify-center px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors w-full sm:w-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              {applyButtonText}
            </button>
          )}
          {showExportButton && (
            <button
              onClick={onExport}
              className="flex items-center justify-center px-4 py-1.5 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportButtonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableFilters;
