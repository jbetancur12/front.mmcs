import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Paper,
  Alert
} from '@mui/material'
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material'
import { api } from 'src/config'
import useAxiosPrivate from 'src/utils/use-axios-private'

interface LmsVideoPlayerProps {
  src: string
  videoSource: 'minio' | 'youtube'
  title?: string
  onProgress?: (currentTime: number, duration: number) => void
  onComplete?: () => void
  autoPlay?: boolean
  controls?: boolean
}

const LmsVideoPlayer: React.FC<LmsVideoPlayerProps> = ({
  src,
  videoSource,
  title,
  onProgress,
  onComplete,
  autoPlay = false,
  controls = true
}) => {
  const axiosPrivate = useAxiosPrivate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolvedSrc, setResolvedSrc] = useState(videoSource === 'minio' ? '' : src)

  // YouTube video handling
  const getYouTubeEmbedUrl = (url: string): string => {
    const videoId = extractYouTubeVideoId(url)
    if (!videoId) return url
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1`
  }

  const extractYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const validateYouTubeUrl = (url: string): boolean => {
    return extractYouTubeVideoId(url) !== null
  }

  // Video event handlers
  const handlePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime
      const total = videoRef.current.duration
      
      setCurrentTime(current)
      
      if (onProgress) {
        onProgress(current, total)
      }

      // Check if video is completed (95% threshold to account for buffering)
      if (total > 0 && current / total >= 0.95 && onComplete) {
        onComplete()
      }
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setIsLoading(false)
    }
  }

  const handleSeek = (value: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value
      setCurrentTime(value)
    }
  }

  const handleVolumeChange = (value: number) => {
    if (videoRef.current) {
      videoRef.current.volume = value
      setVolume(value)
      setIsMuted(value === 0)
    }
  }

  const handleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume
        setIsMuted(false)
      } else {
        videoRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  const handleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  useEffect(() => {
    if (videoSource !== 'minio') {
      setResolvedSrc(src)
      setIsLoading(false)
      setError(null)
      return
    }

    let isCancelled = false
    let objectUrl: string | null = null

    const loadProtectedVideo = async () => {
      try {
        setIsLoading(true)
        setError(null)
        setResolvedSrc('')

        const response = await axiosPrivate.get<ArrayBuffer>(
          src.startsWith('http') ? src : `${api()}${src.startsWith('/') ? src : `/${src}`}`,
          {
            responseType: 'arraybuffer',
            withCredentials: true
          }
        )

        const contentType =
          response.headers['content-type'] ||
          response.headers['Content-Type'] ||
          'video/mp4'
        const blob = new Blob([response.data], { type: contentType })

        if (!blob.size) {
          throw new Error('El video llegó vacío')
        }
        objectUrl = URL.createObjectURL(blob)

        if (!isCancelled) {
          setResolvedSrc(objectUrl)
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Error al cargar el video')
          setIsLoading(false)
        }
      }
    }

    void loadProtectedVideo()

    return () => {
      isCancelled = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [src, videoSource])

  // Handle video errors
  const handleError = () => {
    const mediaError = videoRef.current?.error
    const mediaErrorMessage = mediaError
      ? `Error al cargar el video (codigo ${mediaError.code})`
      : 'Error al cargar el video'

    setError(mediaErrorMessage)
    setIsLoading(false)
  }

  // YouTube iframe for YouTube videos
  if (videoSource === 'youtube') {
    if (!validateYouTubeUrl(src)) {
      return (
        <Alert severity="error">
          URL de YouTube no válida: {src}
        </Alert>
      )
    }

    return (
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          width: '100%',
          paddingBottom: '56.25%', // 16:9 aspect ratio
          height: 0,
          overflow: 'hidden'
        }}
      >
        <Box
          component="iframe"
          src={getYouTubeEmbedUrl(src)}
          title={title || 'Video de YouTube'}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </Box>
    )
  }

  // Custom video player for MinIO videos
  return (
    <Paper
      ref={containerRef}
      sx={{
        position: 'relative',
        backgroundColor: 'black',
        borderRadius: 1,
        overflow: 'hidden'
      }}
    >
      {error ? (
        <Alert severity="error" sx={{ m: 2 }}>
          {error} [video-auth-v2]
        </Alert>
      ) : (
        <>
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 2,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: '#7CFFB2',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.04em'
            }}
          >
            VIDEO AUTH V2
          </Box>
          {resolvedSrc ? (
            <video
              key={resolvedSrc}
              ref={videoRef}
              src={resolvedSrc}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block'
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleError}
              autoPlay={autoPlay}
              preload="metadata"
            />
          ) : null}

          {controls && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                color: 'white',
                p: 2
              }}
            >
              {/* Progress Bar */}
              <Box sx={{ mb: 1 }}>
                <Slider
                  value={currentTime}
                  max={duration}
                  onChange={(_, value) => handleSeek(value as number)}
                  sx={{
                    color: 'primary.main',
                    '& .MuiSlider-thumb': {
                      width: 12,
                      height: 12
                    }
                  }}
                />
              </Box>

              {/* Controls */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <IconButton
                  onClick={handlePlay}
                  sx={{ color: 'white' }}
                  disabled={isLoading}
                >
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </IconButton>

                <Typography variant="caption" sx={{ color: 'white', minWidth: 80 }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Typography>

                <Box sx={{ flexGrow: 1 }} />

                {/* Volume Control */}
                <IconButton
                  onClick={handleMute}
                  sx={{ color: 'white' }}
                >
                  {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>

                <Box sx={{ width: 100 }}>
                  <Slider
                    value={isMuted ? 0 : volume}
                    max={1}
                    step={0.1}
                    onChange={(_, value) => handleVolumeChange(value as number)}
                    sx={{
                      color: 'white',
                      '& .MuiSlider-thumb': {
                        width: 8,
                        height: 8
                      }
                    }}
                  />
                </Box>

                <IconButton
                  onClick={handleFullscreen}
                  sx={{ color: 'white' }}
                >
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Box>
            </Box>
          )}

          {isLoading && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white'
              }}
            >
              <Typography>Cargando video...</Typography>
            </Box>
          )}
        </>
      )}
    </Paper>
  )
}

export default LmsVideoPlayer
