import React, { useState } from 'react';
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
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = async (file) => {
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
    setUploading(true);

    try {
      // Upload PDF
      const uploadResult = await fileUploadService.uploadPDF(file);
      
      if (uploadResult.success && uploadResult.upload) {
        const pdfData = {
          file: file,
          url: fileUploadService.getFileUrl(uploadResult.upload.url),
          preview: fileUploadService.getFileUrl(uploadResult.upload.url),
          isLocal: false,
          uploadResult: uploadResult.upload
        };
        
        setSelectedPDF(pdfData);
        onPDFUpload?.(pdfData);
      } else {
        throw new Error('Invalid upload response');
      }
    } catch (uploadError) {
      setError(uploadError.message || 'Failed to upload PDF');
    } finally {
      setUploading(false);
    }
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
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver 
            ? 'border-gymmawy-primary bg-gymmawy-primary/5' 
            : 'border-gray-300 hover:border-gray-400'
        } ${error ? 'border-red-300 bg-red-50' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {selectedPDF ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <FileText className="h-12 w-12 text-red-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                {selectedPDF.file?.name || 'PDF File'}
              </p>
              {showDetails && (
                <p className="text-xs text-gray-500 mt-1">
                  Size: {formatFileSize(selectedPDF.file?.size || 0)}
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
            <label
              htmlFor="pdf-upload"
              className={`inline-block px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                uploading 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gymmawy-primary text-white hover:bg-gymmawy-secondary'
              }`}
            >
              {uploading ? 'Uploading...' : 'Select PDF File'}
            </label>
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
          <span>PDF uploaded successfully</span>
        </div>
      )}
    </div>
  );
};

export default AdminPDFUpload;
