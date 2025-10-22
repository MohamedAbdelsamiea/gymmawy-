import fileUploadService from './fileUploadService';

/**
 * Draft Upload Service
 * Handles staging files locally until user clicks save
 * Only uploads/removes files from backend when explicitly requested
 */
class DraftUploadService {
  constructor() {
    this.draftFiles = new Map(); // Store draft files by key
    this.draftRemovals = new Set(); // Track files to be removed
  }

  /**
   * Stage a file for upload (don't upload to backend yet)
   * @param {string} key - Unique key for this file (e.g., 'mainImage', 'carouselImage_0')
   * @param {File} file - The file to stage
   * @param {string} category - File category
   * @param {boolean} isPublic - Whether file should be public
   * @returns {Object} Draft file info
   */
  stageFile(key, file, category, isPublic = true) {
    const previewUrl = URL.createObjectURL(file);
    const draftFile = {
      file,
      previewUrl,
      category,
      isPublic,
      originalName: file.name,
      size: file.size,
      type: file.type,
      isStaged: true,
      stagedAt: Date.now()
    };

    this.draftFiles.set(key, draftFile);
    
    // If this key had a previous file, mark it for removal
    const existingFile = this.draftFiles.get(key);
    if (existingFile && existingFile.uploadedUrl) {
      this.draftRemovals.add(existingFile.uploadedUrl);
    }

    return {
      previewUrl,
      originalName: file.name,
      size: file.size,
      type: file.type,
      isStaged: true,
      stagedAt: draftFile.stagedAt
    };
  }

  /**
   * Stage removal of an existing file
   * @param {string} key - Key of the file to remove
   * @param {string} uploadedUrl - URL of the uploaded file to remove
   */
  stageRemoval(key, uploadedUrl) {
    // Remove from draft files
    this.draftFiles.delete(key);
    
    // Mark for removal from backend
    if (uploadedUrl) {
      this.draftRemovals.add(uploadedUrl);
    }
  }

  /**
   * Get staged file info
   * @param {string} key - File key
   * @returns {Object|null} Staged file info or null
   */
  getStagedFile(key) {
    return this.draftFiles.get(key) || null;
  }

  /**
   * Check if a file is staged
   * @param {string} key - File key
   * @returns {boolean} True if file is staged
   */
  isStaged(key) {
    return this.draftFiles.has(key);
  }

  /**
   * Get all staged files
   * @returns {Map} Map of staged files
   */
  getAllStagedFiles() {
    return this.draftFiles;
  }

  /**
   * Get all files marked for removal
   * @returns {Set} Set of URLs to remove
   */
  getFilesToRemove() {
    return this.draftRemovals;
  }

  /**
   * Upload all staged files to backend
   * @returns {Promise<Object>} Upload results keyed by file key
   */
  async uploadStagedFiles() {
    const uploadResults = {};
    const uploadPromises = [];

    for (const [key, draftFile] of this.draftFiles) {
      if (draftFile.isStaged && draftFile.file) {
        const uploadPromise = fileUploadService.uploadFile(
          draftFile.file,
          draftFile.category,
          draftFile.isPublic
        ).then(result => {
          uploadResults[key] = {
            ...result,
            uploadedUrl: fileUploadService.getFileUrl(result.url),
            originalKey: key
          };
          
          // Update the draft file with upload result
          draftFile.uploadedUrl = uploadResults[key].uploadedUrl;
          draftFile.isStaged = false;
          
          return uploadResults[key];
        }).catch(error => {
          console.error(`Failed to upload staged file ${key}:`, error);
          throw error;
        });

        uploadPromises.push(uploadPromise);
      }
    }

    await Promise.all(uploadPromises);
    return uploadResults;
  }

  /**
   * Remove all files marked for removal from backend
   * @returns {Promise<void>}
   */
  async removeMarkedFiles() {
    const removalPromises = [];

    for (const urlToRemove of this.draftRemovals) {
      const removalPromise = fileUploadService.deleteFileByUrl(urlToRemove)
        .catch(error => {
          console.warn(`Failed to remove file ${urlToRemove}:`, error.message);
          // Don't throw here - we don't want removal failures to break the save process
          // For now, we'll just log the warning and continue
          return { success: false, error: error.message };
        });
      
      removalPromises.push(removalPromise);
    }

    const results = await Promise.all(removalPromises);
    this.draftRemovals.clear();
    
    // Log summary of removal results
    const failedRemovals = results.filter(r => r && !r.success);
    if (failedRemovals.length > 0) {
      console.warn(`Failed to remove ${failedRemovals.length} files. This is expected if DELETE routes are not available.`);
    }
  }

  /**
   * Commit all staged changes (upload new files and remove old ones)
   * @returns {Promise<Object>} Results of all operations
   */
  async commitChanges() {
    try {
      // Upload all staged files
      const uploadResults = await this.uploadStagedFiles();
      
      // Remove all marked files
      await this.removeMarkedFiles();
      
      return {
        uploadResults,
        success: true
      };
    } catch (error) {
      console.error('Failed to commit draft changes:', error);
      throw error;
    }
  }

  /**
   * Discard all staged changes
   */
  discardChanges() {
    // Clean up blob URLs to prevent memory leaks
    for (const [key, draftFile] of this.draftFiles) {
      if (draftFile.previewUrl && draftFile.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(draftFile.previewUrl);
      }
    }

    // Clear all staged data
    this.draftFiles.clear();
    this.draftRemovals.clear();
  }

  /**
   * Clear staged changes for a specific key
   * @param {string} key - File key to clear
   */
  clearStagedFile(key) {
    const draftFile = this.draftFiles.get(key);
    if (draftFile && draftFile.previewUrl && draftFile.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(draftFile.previewUrl);
    }
    
    this.draftFiles.delete(key);
  }

  /**
   * Get summary of staged changes
   * @returns {Object} Summary of changes
   */
  getChangesSummary() {
    const stagedCount = this.draftFiles.size;
    const removalCount = this.draftRemovals.size;
    
    return {
      stagedFiles: stagedCount,
      filesToRemove: removalCount,
      hasChanges: stagedCount > 0 || removalCount > 0,
      stagedKeys: Array.from(this.draftFiles.keys()),
      removalUrls: Array.from(this.draftRemovals)
    };
  }

  /**
   * Reset the service (useful for new forms)
   */
  reset() {
    this.discardChanges();
  }
}

// Export singleton instance
export default new DraftUploadService();
