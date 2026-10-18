import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'lab-voice-alerts'

const readEnabled = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

type BrowserWithActivation = Navigator & {
  userActivation?: { hasBeenActive: boolean }
}

// Dos pitidos cortos: respaldo cuando la voz no está disponible o fue bloqueada
const beep = () => {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    ;[0, 0.35].forEach((offset) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 880
      gain.gain.value = 0.15
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + offset)
      osc.stop(ctx.currentTime + offset + 0.2)
    })
    window.setTimeout(() => ctx.close(), 1200)
  } catch {
    // Sin audio disponible: queda el aviso visual
  }
}

/**
 * Avisos por voz con cola: cada mensaje se dice completo, uno tras otro
 * (antes un aviso cortaba al anterior). Si el navegador bloquea la voz
 * hasta que el usuario haga clic, el mensaje espera y suena un pitido.
 */
export const useVoiceAnnouncer = () => {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [enabled, setEnabledState] = useState(readEnabled)
  const [needsClick, setNeedsClick] = useState(
    () =>
      supported &&
      (navigator as BrowserWithActivation).userActivation?.hasBeenActive ===
        false
  )
  const enabledRef = useRef(enabled)
  const queueRef = useRef<string[]>([])
  const speakingRef = useRef(false)

  const processQueue = useCallback(function run() {
    if (speakingRef.current) return
    const message = queueRef.current.shift()
    if (!message) return
    if (!('speechSynthesis' in window)) {
      beep()
      run()
      return
    }
    speakingRef.current = true
    const utterance = new SpeechSynthesisUtterance(message)
    utterance.lang = 'es-ES'
    utterance.rate = 0.9
    const spanish = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith('es'))
    if (spanish) utterance.voice = spanish
    const finish = () => {
      speakingRef.current = false
      run()
    }
    utterance.onend = finish
    utterance.onerror = (event) => {
      if (event.error === 'not-allowed') {
        // Bloqueado hasta que haya un clic: el mensaje se reintenta después
        queueRef.current.unshift(message)
        speakingRef.current = false
        setNeedsClick(true)
        beep()
        return
      }
      finish()
    }
    window.speechSynthesis.resume()
    window.speechSynthesis.speak(utterance)
  }, [])

  // El primer clic en la página desbloquea la voz y suelta los avisos pendientes
  useEffect(() => {
    const unlock = () => {
      setNeedsClick(false)
      processQueue()
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [processQueue])

  const announce = useCallback(
    (message: string) => {
      if (!enabledRef.current) return
      queueRef.current.push(message)
      processQueue()
    },
    [processQueue]
  )

  const setEnabled = useCallback((value: boolean) => {
    enabledRef.current = value
    setEnabledState(value)
    try {
      localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off')
    } catch {
      // Sin almacenamiento: la preferencia dura solo esta sesión
    }
    if (!value) {
      queueRef.current = []
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
      speakingRef.current = false
    }
  }, [])

  // Prueba y desbloqueo desde un botón (un clic cuenta como gesto del usuario)
  const test = useCallback(() => {
    setNeedsClick(false)
    enabledRef.current = true
    setEnabledState(true)
    try {
      localStorage.setItem(STORAGE_KEY, 'on')
    } catch {
      // ver setEnabled
    }
    announce('Avisos de voz activados.')
  }, [announce])

  return { announce, enabled, setEnabled, needsClick, supported, test }
}
