import React from 'react';
import DOMPurify from 'dompurify';

/**
 * HTML Sanitization utilities for frontend
 * Provides secure HTML sanitization for user-generated content
 */

// Configuration for different content types
const sanitizerConfigs = {
  // For WYSIWYG editor content (rich text)
  richText: {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span',
      'pre', 'code', 'hr', 'sub', 'sup', 'del', 'ins'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'style', 'target', 'rel',
      'colspan', 'rowspan', 'align', 'valign', 'width', 'height'
    ],
    // eslint-disable-next-line no-useless-escape -- el \- va dentro de rangos del patron
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'option'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
    KEEP_CONTENT: true
  },

  // For basic text with minimal formatting
  basicText: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u'],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'option'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
    KEEP_CONTENT: true
  },

  // For quiz questions and answers (very restrictive)
  quiz: {
    ALLOWED_TAGS: ['strong', 'em', 'u', 'br'],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'option'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
    KEEP_CONTENT: true
  },

  // Strip all HTML (plain text only)
  plainText: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  }
};

/**
 * Sanitize HTML content based on content type
 * @param html - HTML content to sanitize
 * @param contentType - Type of content (richText, basicText, quiz, plainText)
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = (html: string, contentType: keyof typeof sanitizerConfigs = 'richText'): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const config = sanitizerConfigs[contentType];
  return DOMPurify.sanitize(html, config);
};

/**
 * Sanitize quiz content including questions and options
 * @param quizData - Quiz data object
 * @returns Sanitized quiz data
 */
export function sanitizeQuizContent<T extends object>(quizData: T): T;
export function sanitizeQuizContent(quizData: null): null;
export function sanitizeQuizContent(quizData: undefined): undefined;
export function sanitizeQuizContent<T extends object>(
  quizData: T | null | undefined
): T | null | undefined {
  if (!quizData) return quizData;

  const sanitized = { ...quizData } as Record<string, unknown>;

  // Sanitize quiz title and instructions
  if (typeof sanitized.title === 'string') {
    sanitized.title = sanitizeHtml(sanitized.title, 'basicText');
  }

  if (typeof sanitized.instructions === 'string') {
    sanitized.instructions = sanitizeHtml(sanitized.instructions, 'richText');
  }

  // Sanitize questions
  if (Array.isArray(sanitized.questions)) {
    sanitized.questions = sanitized.questions.map((question) => {
      if (!question || typeof question !== 'object') return question;
      const item = question as Record<string, unknown>;
      return {
        ...item,
        question: typeof item.question === 'string' ? sanitizeHtml(item.question, 'quiz') : item.question,
        explanation: typeof item.explanation === 'string'
          ? sanitizeHtml(item.explanation, 'basicText')
          : item.explanation,
        options: Array.isArray(item.options)
          ? item.options.map((option) => (typeof option === 'string' ? sanitizeHtml(option, 'quiz') : option))
          : item.options
      };
    });
  }

  return sanitized as T;
}

/**
 * Sanitize course content
 * @param courseData - Course data object
 * @returns Sanitized course data
 */
export function sanitizeCourseContent<T extends object>(courseData: T): T;
export function sanitizeCourseContent(courseData: null): null;
export function sanitizeCourseContent(courseData: undefined): undefined;
export function sanitizeCourseContent<T extends object>(
  courseData: T | null | undefined
): T | null | undefined {
  if (!courseData) return courseData;

  const sanitized = { ...courseData } as Record<string, unknown>;

  // Sanitize basic fields
  if (typeof sanitized.title === 'string') {
    sanitized.title = sanitizeHtml(sanitized.title, 'basicText');
  }

  if (typeof sanitized.description === 'string') {
    sanitized.description = sanitizeHtml(sanitized.description, 'richText');
  }

  if (typeof sanitized.objectives === 'string') {
    sanitized.objectives = sanitizeHtml(sanitized.objectives, 'richText');
  }

  return sanitized as T;
}

/**
 * Sanitize lesson content
 * @param lessonData - Lesson data object
 * @returns Sanitized lesson data
 */
export function sanitizeLessonContent<T extends object>(lessonData: T): T;
export function sanitizeLessonContent(lessonData: null): null;
export function sanitizeLessonContent(lessonData: undefined): undefined;
export function sanitizeLessonContent<T extends object>(
  lessonData: T | null | undefined
): T | null | undefined {
  if (!lessonData) return lessonData;

  const sanitized = { ...lessonData } as Record<string, unknown>;

  // Sanitize basic fields
  if (typeof sanitized.title === 'string') {
    sanitized.title = sanitizeHtml(sanitized.title, 'basicText');
  }

  if (typeof sanitized.description === 'string') {
    sanitized.description = sanitizeHtml(sanitized.description, 'richText');
  }

  if (typeof sanitized.content === 'string') {
    sanitized.content = sanitizeHtml(sanitized.content, 'richText');
  }

  return sanitized as T;
}

/**
 * Validate and sanitize YouTube URL
 * @param url - YouTube URL to validate
 * @returns Validation result with cleaned URL
 */
export const validateYouTubeUrl = (url: string): { isValid: boolean; cleanUrl?: string; error?: string } => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'Invalid URL format' };
  }

  // Remove any potential XSS attempts
  const cleanUrl = url.trim().replace(/[<>'"]/g, '');

  // Validate YouTube URL format
  const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}(&[\w=&-]*)?$/;
  
  if (!youtubeRegex.test(cleanUrl)) {
    return { isValid: false, error: 'Invalid YouTube URL format' };
  }

  return {
    isValid: true,
    cleanUrl
  };
};

/**
 * Sanitize user input for forms
 * @param input - User input string
 * @returns Sanitized input
 */
export const sanitizeUserInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove null bytes and control characters
  // eslint-disable-next-line no-control-regex -- quitar bytes de control es el objetivo
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length to prevent DoS
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }

  return sanitized;
};

/**
 * Create a safe HTML renderer component
 * @param html - HTML content to render
 * @param contentType - Type of content for sanitization
 * @returns Object with dangerouslySetInnerHTML property
 */
export const createSafeHtmlRenderer = (html: string, contentType: keyof typeof sanitizerConfigs = 'richText') => {
  const sanitizedHtml = sanitizeHtml(html, contentType);
  return { __html: sanitizedHtml };
};

/**
 * Hook for sanitizing content in React components
 * @param content - Content to sanitize
 * @param contentType - Type of content
 * @returns Sanitized content
 */
export const useSanitizedContent = (content: string, contentType: keyof typeof sanitizerConfigs = 'richText'): string => {
  return React.useMemo(() => {
    return sanitizeHtml(content, contentType);
  }, [content, contentType]);
};

// Export DOMPurify instance for advanced usage
export { DOMPurify };

export default {
  sanitizeHtml,
  sanitizeQuizContent,
  sanitizeCourseContent,
  sanitizeLessonContent,
  validateYouTubeUrl,
  sanitizeUserInput,
  createSafeHtmlRenderer,
  useSanitizedContent,
  DOMPurify
};
