import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Upload, FileText, Image, Video } from 'lucide-react';
import { DataTable, StatusBadge } from '../../../components/dashboard';
import adminApiService from '../../../services/adminApiService';

const ContentManagement = () => {
  const [activeTab, setActiveTab] = useState('videos');
  const [videos, setVideos] = useState([]);
  const [transformations, setTransformations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data based on active tab
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 'videos') {
        const response = await adminApiService.getVideos();
        setVideos(Array.isArray(response.items) ? response.items : []);
      } else if (activeTab === 'descriptions') {
        const response = await adminApiService.getTransformations();
        setTransformations(Array.isArray(response.items) ? response.items : []);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await adminApiService.deleteVideo(videoId);
        fetchData();
      } catch (err) {
        console.error('Error deleting video:', err);
      }
    }
  };

  const videoColumns = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-600 truncate max-w-xs">{value}</span>
      )
    },
    {
      key: 'duration',
      label: 'Duration',
      sortable: true,
      render: (value) => {
        const minutes = Math.floor(value / 60);
        const seconds = value % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value ? 'Published' : 'Draft'} />
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <button 
            className="p-1 text-gray-400 hover:text-blue-600"
            title="View Video"
            onClick={() => window.open(row.videoUrl, '_blank')}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button 
            className="p-1 text-gray-400 hover:text-green-600"
            title="Edit Video"
            onClick={() => {/* Handle edit */}}
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

  const handleDeleteTransformation = async (transformationId) => {
    if (window.confirm('Are you sure you want to delete this transformation?')) {
      try {
        await adminApiService.deleteTransformation(transformationId);
        fetchData();
      } catch (err) {
        console.error('Error deleting transformation:', err);
      }
    }
  };

  const transformationColumns = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-600 truncate max-w-xs">{value}</span>
      )
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value ? 'Published' : 'Draft'} />
    },
    {
      key: 'order',
      label: 'Order',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-blue-600">{value}</span>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <button 
            className="p-1 text-gray-400 hover:text-blue-600"
            title="View Images"
            onClick={() => {
              if (row.beforeImageUrl) window.open(row.beforeImageUrl, '_blank');
            }}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button 
            className="p-1 text-gray-400 hover:text-green-600"
            title="Edit Transformation"
            onClick={() => {/* Handle edit */}}
          >
            <Edit className="h-4 w-4" />
          </button>
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

  const handleExport = (data) => {
    // Exporting content data
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600 mt-1">Manage videos, images, and content</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors">
          <Upload className="h-4 w-4 mr-2" />
          Upload Content
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('videos')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'videos'
                ? 'border-gymmawy-primary text-gymmawy-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Video className="h-4 w-4 inline mr-2" />
            Training Videos
          </button>
          <button
            onClick={() => setActiveTab('descriptions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'descriptions'
                ? 'border-gymmawy-primary text-gymmawy-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Transformations
          </button>
        </nav>
      </div>


      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gymmawy-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <button 
            onClick={fetchData}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {activeTab === 'videos' && (
            <DataTable
              data={videos}
              columns={videoColumns}
              searchable={true}
              filterable={true}
              exportable={true}
              onExport={handleExport}
            />
          )}
          
          {activeTab === 'descriptions' && (
            <DataTable
              data={transformations}
              columns={transformationColumns}
              searchable={true}
              filterable={true}
              exportable={true}
              onExport={handleExport}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ContentManagement;
