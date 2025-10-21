import React, { useState, useEffect } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import fileUploadService from '../../services/fileUploadService';

const AdminPDFUpload = ({ 
  initialPDF = null, 
  onPDFUpload, 
  onPDFRemove, 
  showPreview = true, 
  showDetails = true,
  maxSize = 500 * 1024 * 1024 // 500MB default (no limit as requested)
}) => {
  const [selectedPDF, setSelectedPDF] = useState(initialPDF);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  // Update selectedPDF when initialPDF changes (for edit mode)
  useEffect(() => {
    setSelectedPDF(initialPDF);
  }, [initialPDF]);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (selectedPDF?.isLocal && selectedPDF?.url) {
        URL.revokeObjectURL(selectedPDF.url);
      }
    };
  }, [selectedPDF]);

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file
    const validation = fileUploadService.validateFile(file, { 
      maxSize, 
      isPDF: true 
    });

    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    setError(null);

    // Store file locally without uploading to backend
    const pdfData = {
      file: file,
      url: URL.createObjectURL(file), // Create local preview URL
      preview: URL.createObjectURL(file),
      isLocal: true,
      name: file.name,
      size: file.size
    };
    
    setSelectedPDF(pdfData);
    onPDFUpload?.(pdfData);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      handleFileSelect(pdfFile);
    } else {
      setError('Please select a PDF file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
      };

  const handleRemove = () => {
    // Clean up object URL if it's a local file
    if (selectedPDF?.isLocal && selectedPDF?.url) {
      URL.revokeObjectURL(selectedPDF.url);
    }
    setSelectedPDF(null);
    setError(null);
    onPDFRemove?.();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          dragOver 
            ? 'border-gymmawy-primary bg-gymmawy-primary/5' 
            : 'border-gray-300 hover:border-gray-400'
        } ${error ? 'border-red-300 bg-red-50' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && !selectedPDF && document.getElementById('pdf-upload').click()}
      >
        {selectedPDF ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <FileText className="h-12 w-12 text-red-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                {selectedPDF.file?.name || selectedPDF.name || 
                 (selectedPDF.url && !selectedPDF.isLocal ? 
                   selectedPDF.url.split('/').pop() || 'PDF File' : 'PDF File')}
              </p>
              {showDetails && (
                <p className="text-xs text-gray-500 mt-1">
                  {selectedPDF.isLocal ? `Size: ${formatFileSize(selectedPDF.file?.size || selectedPDF.size || 0)}` : 'Existing PDF'}
                </p>
              )}
            </div>
            <div className="flex justify-center space-x-2">
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 transition-colors"
              >
                Remove
              </button>
              <a
                href={selectedPDF.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 text-sm text-gymmawy-primary hover:text-gymmawy-secondary transition-colors"
              >
                View PDF
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              {uploading ? (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gymmawy-primary"></div>
              ) : (
                <Upload className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {uploading ? 'Uploading PDF...' : 'Upload Programme PDF'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Drag and drop a PDF file here, or click to select
              </p>
              <p className="text-xs text-gray-400 mt-1">
                No size limit - PDF files only
              </p>
            </div>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileInputChange}
              disabled={uploading}
              className="hidden"
              id="pdf-upload"
            />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Success Message */}
      {selectedPDF && !error && (
        <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>{selectedPDF.isLocal ? 'PDF ready to upload' : 'PDF uploaded successfully'}</span>
        </div>
      )}
    </div>
  );
};

export default AdminPDFUpload;
