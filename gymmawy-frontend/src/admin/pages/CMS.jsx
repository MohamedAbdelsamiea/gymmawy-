import React, { useState } from 'react';
import { Image, Video, Plus, Edit, Trash2, Search } from 'lucide-react';
import adminApiService from '../../services/adminApiService';
import DataTable from '../../components/common/DataTable';
import AddTransformationModal from '../../components/modals/AddTransformationModal';
import AddVideoModal from '../../components/modals/AddVideoModal';

const CMS = () => {
  const [activeTab, setActiveTab] = useState('transformations');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const tabs = [
    { id: 'transformations', label: 'Transformations', icon: Image },
    { id: 'videos', label: 'Videos', icon: Video },
  ];

  const handleAdd = () => {
    setEditingItem(null);
    setIsAddModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsAddModalOpen(true);
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setEditingItem(null);
  };

  const handleSuccess = () => {
    // Refresh data - this would be handled by the individual components
    handleModalClose();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600">Manage transformations, videos, and other content</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add {activeTab === 'transformations' ? 'Transformation' : 'Video'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border">
        {activeTab === 'transformations' && (
          <TransformationsTab
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onEdit={handleEdit}
          />
        )}
        {activeTab === 'videos' && (
          <VideosTab
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onEdit={handleEdit}
          />
        )}
      </div>

      {/* Modals */}
      {isAddModalOpen && activeTab === 'transformations' && (
        <AddTransformationModal
          isOpen={isAddModalOpen}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
          editData={editingItem}
          isEdit={!!editingItem}
        />
      )}

      {isAddModalOpen && activeTab === 'videos' && (
        <AddVideoModal
          isOpen={isAddModalOpen}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
          editData={editingItem}
          isEdit={!!editingItem}
        />
      )}
    </div>
  );
};

// Transformations Tab Component
const TransformationsTab = ({ searchTerm, onSearchChange, onEdit }) => {
  const [transformations, setTransformations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const columns = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (value) => (
        <div>
          <div className="font-medium text-gray-900">{value?.en || 'N/A'}</div>
          <div className="text-sm text-gray-500">{value?.ar || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'imageUrl',
      label: 'Image',
      render: (value) => (
        value ? (
          <img
            src={value}
            alt="Transformation"
            className="w-16 h-16 object-cover rounded-lg"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
            <Image className="h-6 w-6 text-gray-400" />
          </div>
        )
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(row)}
            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
            title="Edit transformation"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1 text-red-600 hover:text-red-800 transition-colors"
            title="Delete transformation"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const fetchTransformations = async() => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        q: searchTerm || undefined,
      };

      const response = await adminApiService.getTransformations(params);
      setTransformations(response.items || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
      }));
    } catch (err) {
      setError('Failed to fetch transformations');
      console.error('Error fetching transformations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async(id) => {
    if (window.confirm('Are you sure you want to delete this transformation?')) {
      try {
        await adminApiService.deleteTransformation(id);
        fetchTransformations();
      } catch (err) {
        setError('Failed to delete transformation');
        console.error('Error deleting transformation:', err);
      }
    }
  };

  React.useEffect(() => {
    fetchTransformations();
  }, [pagination.page, pagination.limit, searchTerm]);

  return (
    <div className="p-6">
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transformations..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable
        data={transformations}
        columns={columns}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        onLimitChange={(limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))}
      />
    </div>
  );
};

// Videos Tab Component
const VideosTab = ({ searchTerm, onSearchChange, onEdit }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const columns = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (value) => (
        <div>
          <div className="font-medium text-gray-900">{value?.en || 'N/A'}</div>
          <div className="text-sm text-gray-500">{value?.ar || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'videoUrl',
      label: 'Video',
      render: (value) => (
        <div className="w-24 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
          <Video className="h-6 w-6 text-gray-400" />
        </div>
      ),
    },
    {
      key: 'thumbnailUrl',
      label: 'Thumbnail',
      render: (value) => (
        value ? (
          <img
            src={value}
            alt="Video thumbnail"
            className="w-16 h-16 object-cover rounded-lg"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
            <Image className="h-6 w-6 text-gray-400" />
          </div>
        )
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(row)}
            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
            title="Edit video"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1 text-red-600 hover:text-red-800 transition-colors"
            title="Delete video"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const fetchVideos = async() => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        q: searchTerm || undefined,
      };

      const response = await adminApiService.getVideos(params);
      setVideos(response.items || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
      }));
    } catch (err) {
      setError('Failed to fetch videos');
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async(id) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await adminApiService.deleteVideo(id);
        fetchVideos();
      } catch (err) {
        setError('Failed to delete video');
        console.error('Error deleting video:', err);
      }
    }
  };

  React.useEffect(() => {
    fetchVideos();
  }, [pagination.page, pagination.limit, searchTerm]);

  return (
    <div className="p-6">
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable
        data={videos}
        columns={columns}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        onLimitChange={(limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))}
      />
    </div>
  );
};

export default CMS;