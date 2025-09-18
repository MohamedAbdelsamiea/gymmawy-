import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Eye, Upload, FileText, Image, Video } from 'lucide-react';
import { DataTable, StatusBadge } from '../../../components/dashboard';
import ToggleSwitch from '../../../components/common/ToggleSwitch';
import adminApiService from '../../../services/adminApiService';
import AddVideoModal from '../../../components/modals/AddVideoModal';
import AddTransformationModal from '../../../components/modals/AddTransformationModal';
import { config } from '../../../config';

const ContentManagement = () => {
  const [activeTab, setActiveTab] = useState('videos');
  const [videos, setVideos] = useState([]);
  const [transformations, setTransformations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showTransformationModal, setShowTransformationModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [editingTransformation, setEditingTransformation] = useState(null);

  // Fetch data based on active tab
  useEffect(() => {
    console.log('ContentManagement useEffect - activeTab changed to:', activeTab);
    console.log('fetchData function:', fetchData);
    fetchData();
  }, [activeTab, fetchData]);

  // Debug videos state changes
  useEffect(() => {
    console.log('Videos state changed:', videos);
  }, [videos]);

  const fetchData = useCallback(async() => {
    try {
      console.log('fetchData called with activeTab:', activeTab);
      setLoading(true);
      setError(null);
      
      if (activeTab === 'videos') {
        console.log('Fetching videos...');
        const response = await adminApiService.getVideos();
        console.log('Raw API response:', response);
        console.log('Response type:', typeof response);
        console.log('Response is array:', Array.isArray(response));
        console.log('Response.videos:', response.videos);
        // Handle both array response and object with items property
        const videosData = Array.isArray(response) ? response : (response.videos || response.items || []);
        console.log('Processed videos data:', videosData);
        console.log('Number of videos:', videosData.length);
        console.log('Setting videos state with:', videosData);
        setVideos(videosData);
        console.log('Videos state set, current videos:', videos);
      } else if (activeTab === 'descriptions') {
        console.log('Fetching transformations...');
        const response = await adminApiService.getTransformations();
        console.log('Transformations response:', response); // Debug log
        // Handle both array response and object with items property
        const transformationsData = Array.isArray(response) ? response : (response.transformations || response.items || []);
        console.log('Transformations data:', transformationsData); // Debug log
        console.log('Setting transformations state with:', transformationsData.length, 'items');
        setTransformations(transformationsData);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const handleDeleteVideo = async(videoId) => {
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
      render: (value) => {
        if (typeof value === 'object' && value !== null) {
          return (
            <div>
              <div className="font-medium text-gray-900">{value.en || 'Untitled'}</div>
              <div className="text-sm text-gray-500">{value.ar || ''}</div>
            </div>
          );
        }
        return <span className="font-medium text-gray-900">{value || 'Untitled'}</span>;
      },
    },
    {
      key: 'videoUrl',
      label: 'Video',
      render: (value) => (
        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
          {value ? (
            <video 
              src={value.startsWith('http') ? value : `${config.API_BASE_URL}${value}`}
              className="w-full h-full object-cover rounded-lg"
              controls={false}
            />
          ) : (
            <Video className="h-6 w-6 text-gray-400" />
          )}
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value, row) => (
        <ToggleSwitch
          checked={value}
          onChange={() => handleToggleVideoStatus(row.id, value)}
        />
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value ? new Date(value).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <button 
            className="p-1 text-gray-400 hover:text-blue-600"
            title="View Video"
            onClick={() => window.open(row.videoUrl?.startsWith('http') ? row.videoUrl : `${config.API_BASE_URL}${row.videoUrl}`, '_blank')}
          >
            <Eye className="h-4 w-4" />
          </button>
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
      ),
    },
  ];

  const handleDeleteTransformation = async(transformationId) => {
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
      key: 'imageUrl',
      label: 'Image',
      render: (value) => (
        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
          {value ? (
            <img 
              src={value} 
              alt="Transformation" 
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Image className="h-6 w-6 text-gray-400" />
          )}
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value, row) => (
        <ToggleSwitch
          checked={value}
          onChange={() => handleToggleTransformationStatus(row.id, value)}
          showLabel={true}
          label={value ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value ? new Date(value).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <button 
            className="p-1 text-gray-400 hover:text-blue-600"
            title="View Image"
            onClick={() => {
              if (row.imageUrl) {
                window.open(row.imageUrl, '_blank');
              }
            }}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button 
            className="p-1 text-gray-400 hover:text-green-600"
            title="Edit Transformation"
            onClick={() => handleEditTransformation(row)}
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
      ),
    },
  ];

  const handleExport = (data) => {
    // Exporting content data
  };

  const handleAddVideo = () => {
    setEditingVideo(null);
    setShowVideoModal(true);
  };

  const handleEditVideo = (video) => {
    setEditingVideo(video);
    setShowVideoModal(true);
  };

  const handleAddTransformation = () => {
    setEditingTransformation(null);
    setShowTransformationModal(true);
  };

  const handleEditTransformation = (transformation) => {
    setEditingTransformation(transformation);
    setShowTransformationModal(true);
  };

  const handleModalSuccess = () => {
    fetchData();
  };

  const handleToggleTransformationStatus = async (transformationId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      
      // Optimistically update the local state first for immediate UI feedback
      setTransformations(prevTransformations => 
        prevTransformations.map(transformation => 
          transformation.id === transformationId 
            ? { ...transformation, isActive: newStatus }
            : transformation
        )
      );
      
      // Then make the API call
      await adminApiService.updateTransformation(transformationId, { isActive: newStatus });
    } catch (err) {
      console.error('Error toggling transformation status:', err);
      setError('Failed to update transformation status');
      
      // Revert the optimistic update on error
      setTransformations(prevTransformations => 
        prevTransformations.map(transformation => 
          transformation.id === transformationId 
            ? { ...transformation, isActive: currentStatus }
            : transformation
        )
      );
    }
  };

  const handleToggleVideoStatus = async (videoId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      
      // If trying to activate a video, first deactivate all others
      if (newStatus === true) {
        setVideos(prevVideos => 
          prevVideos.map(video => 
            video.id === videoId 
              ? { ...video, isActive: true }
              : { ...video, isActive: false }
          )
        );
      } else {
        // If trying to deactivate, just update the current video
        setVideos(prevVideos => 
          prevVideos.map(video => 
            video.id === videoId 
              ? { ...video, isActive: false }
              : video
          )
        );
      }
      
      // Then make the API call
      await adminApiService.updateVideo(videoId, { isActive: newStatus });
    } catch (err) {
      console.error('Error toggling video status:', err);
      setError('Failed to update video status');
      
      // Revert the optimistic update on error
      fetchData();
    }
  };

  console.log('ContentManagement render - activeTab:', activeTab, 'videos:', videos.length, 'transformations:', transformations.length);

  // Force a re-render test
  const [forceRender, setForceRender] = useState(0);
  console.log('Force render count:', forceRender);

  return (
    <div className="space-y-6">
      <div className="mb-4 p-2 bg-red-100 rounded text-sm">
        Component Rendered - Active Tab: {activeTab} | Videos: {videos.length} | Transformations: {transformations.length}
        <button onClick={() => setForceRender(prev => prev + 1)} className="ml-2 px-2 py-1 bg-blue-500 text-white rounded">
          Force Re-render
        </button>
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600 mt-1">Manage videos, images, and content</p>
        </div>
        <button 
          onClick={activeTab === 'videos' ? handleAddVideo : handleAddTransformation}
          className="flex items-center px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add {activeTab === 'videos' ? 'Video' : 'Transformation'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              console.log('Videos tab clicked, current activeTab:', activeTab);
              setActiveTab('videos');
            }}
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
            onClick={() => {
              console.log('Descriptions tab clicked, current activeTab:', activeTab);
              setActiveTab('descriptions');
            }}
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
            <div>
              <div className="mb-4 p-2 bg-gray-100 rounded text-sm">
                Debug: {videos.length} videos found
              </div>
              <div className="mb-4 p-2 bg-blue-100 rounded text-sm">
                Active Tab: {activeTab} | Videos State: {JSON.stringify(videos)}
              </div>
              <DataTable
                data={videos}
                columns={videoColumns}
                searchable={true}
                filterable={true}
                exportable={true}
                onExport={handleExport}
              />
            </div>
          )}
          
          {activeTab === 'descriptions' && (
            <div>
              <div className="mb-4 p-2 bg-gray-100 rounded text-sm">
                Debug: {transformations.length} transformations found
              </div>
              <DataTable
                data={transformations}
                columns={transformationColumns}
                searchable={true}
                filterable={true}
                exportable={true}
                onExport={handleExport}
              />
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AddVideoModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        onSuccess={handleModalSuccess}
        editData={editingVideo}
      />

      <AddTransformationModal
        isOpen={showTransformationModal}
        onClose={() => setShowTransformationModal(false)}
        onSuccess={handleModalSuccess}
        editData={editingTransformation}
      />
    </div>
  );
};

export default ContentManagement;
