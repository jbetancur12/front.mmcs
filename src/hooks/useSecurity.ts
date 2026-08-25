import { useState, useCallback, useRef, type ChangeEvent } from 'react';
import { sanitizeHtml, sanitizeUserInput, validateYouTubeUrl } from '../utils/htmlSanitizer';

/**
 * Security hook for React components
 * Provides utilities for secure content handling and validation
 */
export const useSecurity = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Sanitize HTML content with validation
   */
  const sanitizeContent = useCallback((content: string, contentType: 'richText' | 'basicText' | 'quiz' | 'plainText' = 'richText') => {
    setIsValidating(true);
    try {
      const sanitized = sanitizeHtml(content, contentType);
      
      // Check if content was modified during sanitization
      if (sanitized !== content) {
        console.warn('Content was sanitized:', {
          original: content.length,
          sanitized: sanitized.length,
          removed: content.length - sanitized.length
        });
      }
      
      return sanitized;
    } catch (error) {
      console.error('Error sanitizing content:', error);
      return '';
    } finally {
      setIsValidating(false);
    }
  }, []);

  /**
   * Validate file upload with security checks
   */
  const validateFileUpload = useCallback((file: File, allowedTypes: string[], maxSize: number = 50 * 1024 * 1024) => {
    const errors: string[] = [];

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File too large. Maximum size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
    }

    // Check file name for security
    const dangerousPatterns = [
      /\0/,           // Null bytes
      /\.\./,         // Path traversal
      /[<>:"|?*]/,    // Windows reserved characters
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Windows reserved names
      /^\./,          // Hidden files starting with dot
      /\s+$/,         // Trailing whitespace
      /^$/            // Empty name
    ];

    if (dangerousPatterns.some(pattern => pattern.test(file.name))) {
      errors.push('Invalid file name. File name contains prohibited characters');
    }

    // Check for double extensions
    if (/\.[^.]+\.[^.]+$/.test(file.name)) {
      errors.push('Double file extension detected');
    }

    // Check for suspicious extensions
    const suspiciousExtensions = [
      '.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar', '.vbs', '.js', '.jse'
    ];
    
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (suspiciousExtensions.includes(fileExtension)) {
      errors.push('Suspicious file extension detected');
    }

    return {
      isValid: errors.length === 0,
      errors,
      fileInfo: {
        name: file.name,
        type: file.type,
        size: file.size,
        sizeFormatted: formatFileSize(file.size)
      }
    };
  }, []);

  /**
   * Validate YouTube URL with security checks
   */
  const validateYouTube = useCallback((url: string) => {
    return validateYouTubeUrl(url);
  }, []);

  /**
   * Secure form input handler
   */
  const createSecureInputHandler = useCallback((
    setValue: (value: string) => void,
    sanitize: boolean = true
  ) => {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      let value = event.target.value;
      
      if (sanitize) {
        value = sanitizeUserInput(value);
      }
      
      setValue(value);
    };
  }, []);

  /**
   * Validate quiz attempt for suspicious behavior
   */
  const validateQuizAttempt = useCallback((attemptData: {
    timeSpent: number;
    answers: any[];
    score?: number;
    totalPoints?: number;
  }) => {
    const suspiciousFlags: string[] = [];

    // Check for rapid submission (less than 10 seconds)
    if (attemptData.timeSpent < 10) {
      suspiciousFlags.push('rapid_submission');
    }

    // Check for perfect scores on difficult quizzes
    if (attemptData.score && attemptData.totalPoints && 
        attemptData.score === attemptData.totalPoints && 
        attemptData.totalPoints > 50) {
      suspiciousFlags.push('perfect_score_high_difficulty');
    }

    // Check answer patterns
    if (attemptData.answers.length > 5) {
      const answerPattern = attemptData.answers.map(a => a.selectedOption || 0);
      const uniqueAnswers = new Set(answerPattern);
      
      // Check for repeated answer patterns
      if (uniqueAnswers.size === 1) {
        suspiciousFlags.push('repeated_answer_pattern');
      }
    }

    return {
      isSuspicious: suspiciousFlags.length > 0,
      flags: suspiciousFlags,
      riskLevel: suspiciousFlags.length > 2 ? 'high' : suspiciousFlags.length > 0 ? 'medium' : 'low'
    };
  }, []);

  /**
   * Rate limiting helper
   */
  const useRateLimit = useCallback((key: string, limit: number, windowMs: number = 60000) => {
    const now = Date.now();
    const storageKey = `rateLimit_${key}`;
    
    try {
      const stored = localStorage.getItem(storageKey);
      const data = stored ? JSON.parse(stored) : { count: 0, resetTime: now + windowMs };
      
      // Reset if window has passed
      if (now > data.resetTime) {
        data.count = 0;
        data.resetTime = now + windowMs;
      }
      
      // Check if limit exceeded
      if (data.count >= limit) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: data.resetTime,
          retryAfter: Math.ceil((data.resetTime - now) / 1000)
        };
      }
      
      // Increment counter
      data.count++;
      localStorage.setItem(storageKey, JSON.stringify(data));
      
      return {
        allowed: true,
        remaining: limit - data.count,
        resetTime: data.resetTime,
        retryAfter: 0
      };
    } catch (error) {
      console.error('Rate limiting error:', error);
      return { allowed: true, remaining: limit, resetTime: now + windowMs, retryAfter: 0 };
    }
  }, []);

  /**
   * Content Security Policy violation handler
   */
  const handleCSPViolation = useCallback((event: SecurityPolicyViolationEvent) => {
    console.warn('CSP Violation:', {
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
      documentURI: event.documentURI
    });

    // Report to security monitoring (in production)
    // This could send to an analytics service or security monitoring tool
  }, []);

  /**
   * Initialize security monitoring
   */
  const initializeSecurity = useCallback(() => {
    // Add CSP violation listener
    document.addEventListener('securitypolicyviolation', handleCSPViolation);

    // Add beforeunload handler for sensitive pages
    const handleBeforeUnload = (_event: BeforeUnloadEvent) => {
      // This could be used to warn users about unsaved changes
      // or to clear sensitive data from memory
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPViolation);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handleCSPViolation]);

  return {
    // Content sanitization
    sanitizeContent,
    
    // File validation
    validateFileUpload,
    fileInputRef,
    
    // URL validation
    validateYouTube,
    
    // Form security
    createSecureInputHandler,
    
    // Quiz security
    validateQuizAttempt,
    
    // Rate limiting
    useRateLimit,
    
    // Security monitoring
    initializeSecurity,
    
    // State
    isValidating,
    validationErrors,
    setValidationErrors
  };
};

/**
 * Helper function to format file size
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

export default useSecurity;
