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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="md:max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary"
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
        <div className="flex items-end space-x-3">
          {showApplyButton && (
            <button
              onClick={onApplyFilters}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="h-4 w-4 mr-2" />
              {applyButtonText}
            </button>
          )}
          {showExportButton && (
            <button
              onClick={onExport}
              className="flex items-center px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors"
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
