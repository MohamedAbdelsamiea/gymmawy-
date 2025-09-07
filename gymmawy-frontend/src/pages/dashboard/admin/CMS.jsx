import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Video, Image, Search, Filter } from 'lucide-react';
import { DataTable, StatusBadge, TableWithFilters } from '../../../components/dashboard';
import adminApiService from '../../../services/adminApiService';
import AddTransformationModal from '../../../components/modals/AddTransformationModal';
import AddVideoModal from '../../../components/modals/AddVideoModal';

const AdminCMS = () => {
  const [activeTab, setActiveTab] = useState('transformations');
  const [transformations, setTransformations] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showTransformationModal, setShowTransformationModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editingTransformation, setEditingTransformation] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  const [videoModalMode, setVideoModalMode] = useState('create'); // 'create' or 'edit'
  const [videoModalKey, setVideoModalKey] = useState(0); // Force re-render

  useEffect(() => {
    if (activeTab === 'transformations') {
      fetchTransformations();
    } else {
      fetchVideos();
    }
  }, [activeTab, searchTerm]);

  const fetchTransformations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminApiService.getTransformations();
      let data = Array.isArray(response.items) ? response.items : Array.isArray(response) ? response : [];
      
      if (searchTerm && Array.isArray(data)) {
        data = data.filter(item => {
          const titleEn = item.title?.en?.toLowerCase() || '';
          const titleAr = item.title?.ar?.toLowerCase() || '';
          return titleEn.includes(searchTerm.toLowerCase()) || 
                 titleAr.includes(searchTerm.toLowerCase());
        });
      }
      
      setTransformations(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching transformations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminApiService.getVideos();
      let data = Array.isArray(response.items) ? response.items : Array.isArray(response) ? response : [];
      
      if (searchTerm && Array.isArray(data)) {
        data = data.filter(item => {
          const titleEn = item.title?.en?.toLowerCase() || '';
          const titleAr = item.title?.ar?.toLowerCase() || '';
          return titleEn.includes(searchTerm.toLowerCase()) || 
                 titleAr.includes(searchTerm.toLowerCase());
        });
      }
      
      setVideos(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransformation = async (id) => {
    if (window.confirm('Are you sure you want to delete this transformation?')) {
      try {
        await adminApiService.deleteTransformation(id);
        fetchTransformations();
      } catch (err) {
        console.error('Error deleting transformation:', err);
      }
    }
  };

  const handleDeleteVideo = async (id) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await adminApiService.deleteVideo(id);
        fetchVideos();
      } catch (err) {
        console.error('Error deleting video:', err);
      }
    }
  };

  // Modal handlers
  const handleCreateTransformation = () => {
    // Reset all modal states first
    setEditingTransformation(null);
    setEditingVideo(null);
    setShowVideoModal(false);
    setShowTransformationModal(true);
  };

  const handleEditTransformation = (transformation) => {
    setEditingTransformation(transformation);
    setShowTransformationModal(true);
  };

  const handleCreateVideo = () => {
    // Close any open modals first
    setShowVideoModal(false);
    setShowTransformationModal(false);
    // Reset all states immediately
    setEditingVideo(null);
    setEditingTransformation(null);
    setVideoModalMode('create');
    setVideoModalKey(prev => prev + 1); // Force re-render
    // Open modal immediately after state reset
    setShowVideoModal(true);
  };

  const handleEditVideo = (video) => {
    setVideoModalMode('edit');
    setEditingVideo(video);
    setVideoModalKey(prev => prev + 1); // Force re-render
    setShowVideoModal(true);
  };

  const handleModalClose = () => {
    setShowTransformationModal(false);
    setShowVideoModal(false);
    setEditingTransformation(null);
    setEditingVideo(null);
    setVideoModalMode('create');
  };

  const handleModalSuccess = () => {
    if (activeTab === 'transformations') {
      fetchTransformations();
    } else {
      fetchVideos();
    }
  };

  const transformationColumns = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (value) => (
        <div className="font-medium text-gray-900">
          <div>{value?.en || 'N/A'}</div>
          <div className="text-sm text-gray-500" dir="rtl">{value?.ar || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'imageUrl',
      label: 'Image',
      sortable: false,
      render: (value) => (
        <div className="w-16 h-16">
          {value ? (
            <img
              src={value}
              alt="Transformation"
              className="w-full h-full object-cover rounded"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
              <span className="text-gray-400 text-xs">No Image</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <button 
            className="p-1 text-gray-400 hover:text-red-600" 
            title="Delete Transformation"
            onClick={() => handleDeleteTransformation(row.id)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  const videoColumns = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (value) => (
        <div className="font-medium text-gray-900">
          <div>{value?.en || 'N/A'}</div>
          <div className="text-sm text-gray-500" dir="rtl">{value?.ar || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'videoUrl',
      label: 'Video',
      sortable: false,
      render: (value) => (
        <div className="w-16 h-16">
          {value ? (
            <video
              src={value}
              className="w-full h-full object-cover rounded"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
              <span className="text-gray-400 text-xs">No Video</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'thumbnailEn',
      label: 'Thumbnail',
      sortable: false,
      render: (value, row) => (
        <div className="w-16 h-16">
          {value || row.thumbnailAr ? (
            <img
              src={value || row.thumbnailAr}
              alt="Thumbnail"
              className="w-full h-full object-cover rounded"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
              <span className="text-gray-400 text-xs">No Thumbnail</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <button 
            className="p-1 text-gray-400 hover:text-green-600" 
            title="Edit Video"
            onClick={() => handleEditVideo(row)}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button 
            className="p-1 text-gray-400 hover:text-red-600" 
            title="Delete Video"
            onClick={() => handleDeleteVideo(row.id)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gymmawy-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button 
          onClick={activeTab === 'transformations' ? fetchTransformations : fetchVideos}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Management System</h1>
          <p className="text-gray-600 mt-1">Manage transformations and video content</p>
        </div>
        <button 
          onClick={() => {
            if (activeTab === 'transformations') {
              handleCreateTransformation();
            } else {
              handleCreateVideo();
            }
          }}
          className="flex items-center px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add {activeTab === 'transformations' ? 'Transformation' : 'Video'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('transformations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transformations'
                ? 'border-gymmawy-primary text-gymmawy-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Image className="h-4 w-4 inline mr-2" />
            Transformations
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'videos'
                ? 'border-gymmawy-primary text-gymmawy-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Video className="h-4 w-4 inline mr-2" />
            Videos
          </button>
        </nav>
      </div>

      {/* Results Counter */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Showing {activeTab === 'transformations' ? (Array.isArray(transformations) ? transformations.length : 0) : (Array.isArray(videos) ? videos.length : 0)} {activeTab}
            </span>
            {searchTerm && (
              <span className="text-sm text-gray-500">
                filtered by "{searchTerm}"
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {activeTab === 'transformations' 
                ? `${Array.isArray(transformations) ? transformations.filter(t => t.status === 'active').length : 0} active`
                : `${Array.isArray(videos) ? videos.reduce((sum, v) => sum + (v.views || 0), 0) : 0} total views`
              }
            </span>
          </div>
        </div>
      </div>

      {/* Content Table with Integrated Filters */}
      <TableWithFilters
        data={activeTab === 'transformations' ? (Array.isArray(transformations) ? transformations : []) : (Array.isArray(videos) ? videos : [])}
        columns={activeTab === 'transformations' ? transformationColumns : videoColumns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={`Search ${activeTab}...`}
        filters={[]}
        onApplyFilters={() => {}}
        onExport={() => {}}
        showApplyButton={false}
        showExportButton={false}
      />

      {/* Modals */}
      <AddTransformationModal
        key={`transformation-modal-${editingTransformation ? editingTransformation.id : 'new'}`}
        isOpen={showTransformationModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        transformation={editingTransformation}
        isEdit={!!editingTransformation}
      />

      <AddVideoModal
        key={`video-modal-${videoModalKey}`}
        isOpen={showVideoModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        video={editingVideo}
        isEdit={videoModalMode === 'edit'}
      />
    </div>
  );
};

export default AdminCMS;
