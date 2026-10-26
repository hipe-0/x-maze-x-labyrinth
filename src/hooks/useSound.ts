import { useCallback, useMemo, useRef } from 'react'

export interface SoundApi {
  playClick: () => void
  playBlocked: () => void
  playWin: () => void
}

function makeNoiseClick(context: AudioContext): void {
  const duration = 0.022
  const frameCount = Math.max(1, Math.floor(context.sampleRate * duration))
  const buffer = context.createBuffer(1, frameCount, context.sampleRate)
  const data = buffer.getChannelData(0)

  for (let index = 0; index < frameCount; index += 1) {
    const envelope = 1 - index / frameCount
    data[index] = (Math.random() * 2 - 1) * envelope * envelope
  }

  const source = context.createBufferSource()
  source.buffer = buffer

  const filter = context.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 900

  const gain = context.createGain()
  gain.gain.value = 0.035

  source.connect(filter)
  filter.connect(gain)
  gain.connect(context.destination)
  source.start()
}

function makeTone(
  context: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  volume: number,
): void {
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(frequency, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.02)
}

export function useSound(muted: boolean): SoundApi {
  const contextRef = useRef<AudioContext | null>(null)

  const getContext = useCallback((): AudioContext | null => {
    if (muted || typeof window === 'undefined') return null

    let context = contextRef.current
    if (!context) {
      const AudioContextClass =
        window.AudioContext ??
        (
          window as unknown as {
            webkitAudioContext?: typeof AudioContext
          }
        ).webkitAudioContext
      if (!AudioContextClass) return null
      context = new AudioContextClass()
      contextRef.current = context
    }

    if (context.state === 'suspended') {
      void context.resume()
    }
    return context
  }, [muted])

  const playClick = useCallback(() => {
    const context = getContext()
    if (context) makeNoiseClick(context)
  }, [getContext])

  const playBlocked = useCallback(() => {
    const context = getContext()
    if (!context) return
    makeTone(context, 118, context.currentTime, 0.09, 0.016)
  }, [getContext])

  const playWin = useCallback(() => {
    const context = getContext()
    if (!context) return
    const start = context.currentTime + 0.02
    makeTone(context, 523.25, start, 0.16, 0.024)
    makeTone(context, 783.99, start + 0.13, 0.22, 0.022)
    makeTone(context, 1046.5, start + 0.27, 0.28, 0.018)
  }, [getContext])

  return useMemo(
    () => ({ playClick, playBlocked, playWin }),
    [playClick, playBlocked, playWin],
  )
}
