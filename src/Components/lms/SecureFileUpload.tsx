import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useSecurity } from '../../hooks/useSecurity';
import axios from 'axios';

interface FileUploadProps {
  acceptedTypes: string[];
  maxFileSize?: number;
  maxFiles?: number;
  uploadEndpoint: string;
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  securityScan?: {
    status: 'pending' | 'clean' | 'threat' | 'error';
    threats?: string[];
    scanDate?: string;
  };
}

interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  fileInfo: {
    name: string;
    type: string;
    size: number;
    sizeFormatted: string;
  };
}

const SecureFileUpload: React.FC<FileUploadProps> = ({
  acceptedTypes,
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  maxFiles = 5,
  uploadEndpoint,
  onUploadComplete,
  onUploadError,
  disabled = false,
  label = 'Upload Files',
  description = 'Select files to upload'
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showSecurityDialog, setShowSecurityDialog] = useState(false);
  const [securityScanResults, setSecurityScanResults] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { validateFileUpload, useRateLimit } = useSecurity();

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const errors: string[] = [];
    const validFiles: File[] = [];

    // Check rate limiting
    const rateLimit = useRateLimit('file_upload', 20, 60 * 60 * 1000); // 20 uploads per hour
    if (!rateLimit.allowed) {
      errors.push(`Upload rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds.`);
      setValidationErrors(errors);
      return;
    }

    // Validate each file
    selectedFiles.forEach((file, index) => {
      const validation = validateFileUpload(file, acceptedTypes, maxFileSize);
      
      if (!validation.isValid) {
        errors.push(`File ${index + 1} (${file.name}): ${validation.errors.join(', ')}`);
      } else {
        validFiles.push(file);
      }
    });

    // Check total file count
    if (files.length + validFiles.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed. Currently have ${files.length} files.`);
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
    } else {
      setValidationErrors([]);
      setFiles(prev => [...prev, ...validFiles]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [files.length, acceptedTypes, maxFileSize, maxFiles, validateFileUpload, useRateLimit]);

  /**
   * Remove file from selection
   */
  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setValidationErrors([]);
  }, []);

  /**
   * Upload files to server
   */
  const uploadFiles = useCallback(async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      
      // Add files to form data
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });

      // Upload with progress tracking
      const response = await axios.post(uploadEndpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(progress);
        },
      });

      if (response.data.success) {
        const uploadedFiles: UploadedFile[] = Array.isArray(response.data.data) 
          ? response.data.data 
          : [response.data.data];
        
        setUploadedFiles(prev => [...prev, ...uploadedFiles]);
        setFiles([]);
        
        if (onUploadComplete) {
          onUploadComplete(uploadedFiles);
        }
      } else {
        throw new Error(response.data.error?.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Upload failed';
      setValidationErrors([errorMessage]);
      
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [files, uploadEndpoint, onUploadComplete, onUploadError]);

  /**
   * Check security scan results
   */
  const checkSecurityScan = useCallback(async (fileId: string) => {
    try {
      const response = await axios.get(`/api/lms/uploads/scan-results/${fileId}`);
      setSecurityScanResults(response.data.data);
      setShowSecurityDialog(true);
    } catch (error) {
      console.error('Error checking security scan:', error);
    }
  }, []);

  /**
   * Get security status icon
   */
  const getSecurityStatusIcon = (status?: string) => {
    switch (status) {
      case 'clean':
        return <CheckIcon color="success" />;
      case 'threat':
        return <ErrorIcon color="error" />;
      case 'pending':
        return <InfoIcon color="info" />;
      default:
        return <WarningIcon color="warning" />;
    }
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <Box>
      {/* Upload Area */}
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: disabled ? 'grey.300' : 'primary.main',
          backgroundColor: disabled ? 'grey.50' : 'background.paper',
          cursor: disabled ? 'not-allowed' : 'pointer',
          '&:hover': {
            backgroundColor: disabled ? 'grey.50' : 'action.hover',
          },
        }}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={disabled}
        />
        
        <UploadIcon sx={{ fontSize: 48, color: disabled ? 'grey.400' : 'primary.main', mb: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          {label}
        </Typography>
        
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {description}
        </Typography>
        
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Accepted types: {acceptedTypes.join(', ')}
        </Typography>
        
        <Typography variant="caption" display="block">
          Max size: {formatFileSize(maxFileSize)} | Max files: {maxFiles}
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          sx={{ mt: 2 }}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          Select Files
        </Button>
      </Paper>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Validation Errors:
          </Typography>
          {validationErrors.map((error, index) => (
            <Typography key={index} variant="body2">
              • {error}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Selected Files */}
      {files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected Files ({files.length}/{maxFiles})
          </Typography>
          
          <List dense>
            {files.map((file, index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={file.name}
                  secondary={`${formatFileSize(file.size)} • ${file.type}`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => removeFile(index)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={uploadFiles}
              disabled={uploading || files.length === 0}
              startIcon={<UploadIcon />}
            >
              {uploading ? 'Uploading...' : 'Upload Files'}
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => setFiles([])}
              disabled={uploading}
            >
              Clear All
            </Button>
          </Box>

          {/* Upload Progress */}
          {uploading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Uploading... {uploadProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}
        </Box>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Uploaded Files
          </Typography>
          
          <List dense>
            {uploadedFiles.map((file, index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={file.name}
                  secondary={`${formatFileSize(file.size)} • ${file.type}`}
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tooltip title={`Security scan: ${file.securityScan?.status || 'unknown'}`}>
                      <IconButton
                        size="small"
                        onClick={() => checkSecurityScan(file.id)}
                      >
                        {getSecurityStatusIcon(file.securityScan?.status)}
                      </IconButton>
                    </Tooltip>
                    
                    <Chip
                      label={file.securityScan?.status || 'pending'}
                      size="small"
                      color={
                        file.securityScan?.status === 'clean' ? 'success' :
                        file.securityScan?.status === 'threat' ? 'error' :
                        'default'
                      }
                    />
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Security Scan Results Dialog */}
      <Dialog
        open={showSecurityDialog}
        onClose={() => setShowSecurityDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon />
            Security Scan Results
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {securityScanResults && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Scan Status: {securityScanResults.scanStatus}
              </Typography>
              
              <Typography variant="body2" gutterBottom>
                Scan Date: {new Date(securityScanResults.scanDate).toLocaleString()}
              </Typography>
              
              <Typography variant="body2" gutterBottom>
                Scan Engine: {securityScanResults.scanEngine}
              </Typography>
              
              {securityScanResults.threats && securityScanResults.threats.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="error" gutterBottom>
                    Threats Detected:
                  </Typography>
                  {securityScanResults.threats.map((threat: string, index: number) => (
                    <Typography key={index} variant="body2" color="error">
                      • {threat}
                    </Typography>
                  ))}
                </Box>
              )}
              
              {securityScanResults.scanStatus === 'clean' && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  No security threats detected. File is safe to use.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowSecurityDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecureFileUpload;