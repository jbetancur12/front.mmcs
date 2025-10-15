// Animated Components with Reduced Motion Support
import React from 'react'
import { Box, Fade, Slide, Grow, Collapse } from '@mui/material'
import { useAnimation } from './AnimationProvider'
import { colors } from '../../theme/designSystem'

interface AnimatedBoxProps {
  children: React.ReactNode
  animation?: 'fadeIn' | 'slideUp' | 'slideDown' | 'scaleIn'
  delay?: number
  duration?: 'short' | 'medium' | 'long'
  [key: string]: any
}

export const AnimatedBox: React.FC<AnimatedBoxProps> = ({
  children,
  animation = 'fadeIn',
  delay = 0,
  duration = 'medium',
  ...props
}) => {
  const { getAnimation, prefersReducedMotion } = useAnimation()

  if (prefersReducedMotion) {
    return <Box {...props}>{children}</Box>
  }

  return (
    <Box
      sx={{
        animation: getAnimation(animation, duration),
        animationDelay: `${delay}ms`,
        animationFillMode: 'both',
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Box>
  )
}

interface FadeTransitionProps {
  in: boolean
  children: React.ReactElement
  timeout?: number
}

export const FadeTransition: React.FC<FadeTransitionProps> = ({
  in: inProp,
  children,
  timeout = 300
}) => {
  const { prefersReducedMotion } = useAnimation()

  return (
    <Fade in={inProp} timeout={prefersReducedMotion ? 0 : timeout}>
      {children}
    </Fade>
  )
}

interface SlideTransitionProps {
  in: boolean
  children: React.ReactElement
  direction?: 'up' | 'down' | 'left' | 'right'
  timeout?: number
}

export const SlideTransition: React.FC<SlideTransitionProps> = ({
  in: inProp,
  children,
  direction = 'up',
  timeout = 300
}) => {
  const { prefersReducedMotion } = useAnimation()

  return (
    <Slide
      in={inProp}
      direction={direction}
      timeout={prefersReducedMotion ? 0 : timeout}
    >
      {children}
    </Slide>
  )
}

interface GrowTransitionProps {
  in: boolean
  children: React.ReactElement
  timeout?: number
}

export const GrowTransition: React.FC<GrowTransitionProps> = ({
  in: inProp,
  children,
  timeout = 300
}) => {
  const { prefersReducedMotion } = useAnimation()

  return (
    <Grow in={inProp} timeout={prefersReducedMotion ? 0 : timeout}>
      {children}
    </Grow>
  )
}

interface CollapseTransitionProps {
  in: boolean
  children: React.ReactNode
  timeout?: number
}

export const CollapseTransition: React.FC<CollapseTransitionProps> = ({
  in: inProp,
  children,
  timeout = 300
}) => {
  const { prefersReducedMotion } = useAnimation()

  return (
    <Collapse in={inProp} timeout={prefersReducedMotion ? 0 : timeout}>
      {children}
    </Collapse>
  )
}

interface LoadingShimmerProps {
  width?: number | string
  height?: number | string
  borderRadius?: number | string
}

export const LoadingShimmer: React.FC<LoadingShimmerProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4
}) => {
  const { getAnimation, prefersReducedMotion } = useAnimation()

  return (
    <Box
      sx={{
        width,
        height,
        borderRadius,
        backgroundColor: colors.gray[200],
        background: prefersReducedMotion
          ? colors.gray[200]
          : `linear-gradient(90deg, ${colors.gray[200]} 0%, ${colors.gray[100]} 50%, ${colors.gray[200]} 100%)`,
        backgroundSize: '200px 100%',
        animation: prefersReducedMotion
          ? 'none'
          : getAnimation('shimmer', 'long'),
        animationIterationCount: 'infinite'
      }}
    />
  )
}

interface PulseProps {
  children: React.ReactNode
  active?: boolean
  intensity?: 'low' | 'medium' | 'high'
}

export const Pulse: React.FC<PulseProps> = ({
  children,
  active = true,
  intensity = 'medium'
}) => {
  const { getAnimation, prefersReducedMotion } = useAnimation()

  const intensityMap = {
    low: 'pulse-low',
    medium: 'pulse',
    high: 'pulse-high'
  }

  return (
    <Box
      sx={{
        animation:
          active && !prefersReducedMotion
            ? getAnimation(intensityMap[intensity], 'long')
            : 'none',
        animationIterationCount: 'infinite'
      }}
    >
      {children}
    </Box>
  )
}

interface HoverScaleProps {
  children: React.ReactNode
  scale?: number
  [key: string]: any
}

export const HoverScale: React.FC<HoverScaleProps> = ({
  children,
  scale = 1.05,
  ...props
}) => {
  const { getTransition, prefersReducedMotion } = useAnimation()

  return (
    <Box
      sx={{
        transition: prefersReducedMotion
          ? 'none'
          : getTransition('transform', 'short'),
        '&:hover': {
          transform: prefersReducedMotion ? 'none' : `scale(${scale})`
        },
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Box>
  )
}

export default {
  AnimatedBox,
  FadeTransition,
  SlideTransition,
  GrowTransition,
  CollapseTransition,
  LoadingShimmer,
  Pulse,
  HoverScale
}
