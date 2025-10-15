// Animation Provider with Reduced Motion Support
import React, { createContext, useContext, ReactNode } from 'react'
import { useReducedMotion } from './hooks/useAccessibility'

interface AnimationConfig {
  duration: {
    short: number
    medium: number
    long: number
  }
  easing: {
    easeInOut: string
    easeOut: string
    easeIn: string
  }
  scale: number
}

interface AnimationContextType {
  config: AnimationConfig
  prefersReducedMotion: boolean
  getTransition: (
    property: string,
    duration?: 'short' | 'medium' | 'long'
  ) => string
  getAnimation: (
    keyframes: string,
    duration?: 'short' | 'medium' | 'long'
  ) => string
}

const defaultConfig: AnimationConfig = {
  duration: {
    short: 150,
    medium: 300,
    long: 500
  },
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)'
  },
  scale: 1
}

const reducedMotionConfig: AnimationConfig = {
  duration: {
    short: 0,
    medium: 0,
    long: 0
  },
  easing: {
    easeInOut: 'linear',
    easeOut: 'linear',
    easeIn: 'linear'
  },
  scale: 0
}

const AnimationContext = createContext<AnimationContextType | undefined>(
  undefined
)

interface AnimationProviderProps {
  children: ReactNode
}

export const AnimationProvider: React.FC<AnimationProviderProps> = ({
  children
}) => {
  const prefersReducedMotion = useReducedMotion()
  const config = prefersReducedMotion ? reducedMotionConfig : defaultConfig

  const getTransition = (
    property: string,
    duration: 'short' | 'medium' | 'long' = 'medium'
  ) => {
    if (prefersReducedMotion) {
      return 'none'
    }
    return `${property} ${config.duration[duration]}ms ${config.easing.easeInOut}`
  }

  const getAnimation = (
    keyframes: string,
    duration: 'short' | 'medium' | 'long' = 'medium'
  ) => {
    if (prefersReducedMotion) {
      return 'none'
    }
    return `${keyframes} ${config.duration[duration]}ms ${config.easing.easeInOut}`
  }

  const contextValue: AnimationContextType = {
    config,
    prefersReducedMotion,
    getTransition,
    getAnimation
  }

  return (
    <AnimationContext.Provider value={contextValue}>
      {children}
    </AnimationContext.Provider>
  )
}

export const useAnimation = () => {
  const context = useContext(AnimationContext)
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider')
  }
  return context
}

// Predefined animation styles
export const animations = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,
  slideUp: `
    @keyframes slideUp {
      from { 
        opacity: 0; 
        transform: translateY(20px); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0); 
      }
    }
  `,
  slideDown: `
    @keyframes slideDown {
      from { 
        opacity: 0; 
        transform: translateY(-20px); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0); 
      }
    }
  `,
  scaleIn: `
    @keyframes scaleIn {
      from { 
        opacity: 0; 
        transform: scale(0.95); 
      }
      to { 
        opacity: 1; 
        transform: scale(1); 
      }
    }
  `,
  pulse: `
    @keyframes pulse {
      0%, 100% { 
        opacity: 1; 
      }
      50% { 
        opacity: 0.7; 
      }
    }
  `,
  shimmer: `
    @keyframes shimmer {
      0% {
        background-position: -200px 0;
      }
      100% {
        background-position: calc(200px + 100%) 0;
      }
    }
  `
}

export default AnimationProvider
