import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronUp, ChevronDown, Search, Filter, Download } from 'lucide-react';

const DataTable = ({ 
  data, 
  columns, 
  searchable = true, 
  filterable = true, 
  exportable = true,
  sortable = true,
  onExport,
  className = '', 
}) => {
  const { t } = useTranslation("dashboard");
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Debug logging
  console.log('DataTable received data:', data);
  console.log('DataTable received columns:', columns);

  // Filter data based on search term
  const filteredData = data.filter(item => {
    const matches = Object.values(item).some(value => {
      if (typeof value === 'object' && value !== null) {
        // Handle nested objects (like title: {en: "video", ar: "فيديو"})
        return Object.values(value).some(nestedValue =>
          String(nestedValue).toLowerCase().includes(searchTerm.toLowerCase()),
        );
      }
      return String(value).toLowerCase().includes(searchTerm.toLowerCase());
    });
    return matches;
  });

  console.log('DataTable filtered data:', filteredData);
  console.log('DataTable search term:', searchTerm);

  // Sort data with proper type handling
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) {
return 0;
}
    
    // Check if the column has a custom sort function
    const column = columns.find(col => col.key === sortConfig.key);
    if (column && column.sortFunction) {
      return column.sortFunction(a, b, sortConfig.direction);
    }
    
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    
    // Handle null/undefined values
    if (aValue === null || aValue === undefined) {
aValue = '';
}
    if (bValue === null || bValue === undefined) {
bValue = '';
}
    
    // Handle date sorting
    if (sortConfig.key === 'birthDate' || sortConfig.key === 'createdAt' || sortConfig.key === 'lastLoginAt' || sortConfig.key === 'updatedAt') {
      // Handle null/empty dates - put them at the end when sorting ascending, at the beginning when descending
      const aDate = aValue ? new Date(aValue) : null;
      const bDate = bValue ? new Date(bValue) : null;
      
      // If both are null, they're equal
      if (!aDate && !bDate) {
return 0;
}
      
      // If one is null, handle based on sort direction
      // For lastLoginAt, null means "Never" - put at the end for asc, beginning for desc
      if (!aDate) {
return sortConfig.direction === 'asc' ? 1 : -1;
}
      if (!bDate) {
return sortConfig.direction === 'asc' ? -1 : 1;
}
      
      // Both dates exist, compare them
      if (aDate.getTime() < bDate.getTime()) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aDate.getTime() > bDate.getTime()) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    }
    
    // Handle numeric sorting
    if (sortConfig.key === 'loyaltyPoints' || sortConfig.key === 'failedLoginAttempts') {
      const aNum = parseFloat(aValue) || 0;
      const bNum = parseFloat(bValue) || 0;
      
      if (aNum < bNum) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aNum > bNum) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    }
    
    // Handle boolean sorting
    if (sortConfig.key === 'emailVerified') {
      const aBool = Boolean(aValue);
      const bBool = Boolean(bValue);
      
      if (aBool === bBool) {
return 0;
}
      if (aBool && !bBool) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (!aBool && bBool) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
    }
    
    // Handle string sorting (case insensitive)
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    
    if (aStr < bStr) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aStr > bStr) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Paginate data
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleExport = () => {
    if (onExport) {
      onExport(sortedData);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Table Header with Search and Actions */}
      <div className="">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <input
                    type="text"
                    placeholder={t('common.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  />
              </div>
            )}
            {filterable && (
              <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                <Filter className="h-4 w-4 mr-2" />
                {t('common.filter')}
              </button>
            )}
          </div>
          
          {exportable && (
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 bg-gymmawy-primary text-white rounded-lg text-sm hover:bg-gymmawy-secondary transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              {t('common.export')}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${sortable && column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                  onClick={() => sortable && column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.label}
                    {column.sortable && (
                      <div className="ml-1">
                        {sortConfig.key === column.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )
                        ) : (
                          <div className="h-4 w-4" />
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(row[column.key], row) : (() => {
                      const value = row[column.key];
                      // Handle bilingual objects
                      if (typeof value === 'object' && value !== null && value.ar && value.en) {
                        return value.en || value.ar || '';
                      }
                      return value;
                    })()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              {t('common.showing')} {startIndex + 1} {t('common.to')} {Math.min(endIndex, sortedData.length)} {t('common.of')} {sortedData.length} {t('common.results')}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                {t('common.previous')}
              </button>
              <span className="px-3 py-1 text-sm">
                {t('common.page')} {currentPage} {t('common.of')} {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
