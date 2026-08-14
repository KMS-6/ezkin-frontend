import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import type { SkinScanErrorCode } from '../../../types/skinScan'
import { ScanFrame } from './ScanFrame'

export interface ScanCameraHandle {
  capture: () => Promise<Blob>
}

interface ScanCameraProps {
  isRequesting: boolean
  countdown: number | null
  onReady: () => void
  onError: (code: SkinScanErrorCode) => void
}

export const ScanCamera = forwardRef<ScanCameraHandle, ScanCameraProps>(function ScanCamera({
  isRequesting,
  countdown,
  onReady,
  onError,
}, forwardedRef) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  useEffect(() => {
    let isActive = true

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        onError('unsupported')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'user' } },
        })

        if (!isActive) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        onReady()
      } catch (error) {
        if (!isActive) return
        stopCamera()
        onError(
          error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError')
            ? 'permission_denied'
            : 'camera_unavailable',
        )
      }
    }

    void startCamera()
    return () => {
      isActive = false
      stopCamera()
    }
  }, [onError, onReady, stopCamera])

  useImperativeHandle(forwardedRef, () => ({
    capture: () => new Promise<Blob>((resolve, reject) => {
      const video = videoRef.current
      if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
        reject(new Error('Camera frame is not ready.'))
        return
      }

      const maxWidth = 1280
      const scale = Math.min(1, maxWidth / video.videoWidth)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(video.videoWidth * scale)
      canvas.height = Math.round(video.videoHeight * scale)
      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('Canvas is not available.'))
        return
      }

      // 전면 카메라 미리보기와 저장 이미지가 같은 방향으로 보이도록 함께 좌우 반전합니다.
      context.translate(canvas.width, 0)
      context.scale(-1, 1)
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Could not capture the camera frame.'))
          return
        }
        stopCamera()
        resolve(blob)
      }, 'image/jpeg', 0.9)
    }),
  }), [stopCamera])

  return (
    <ScanFrame
      videoRef={videoRef}
      isRequesting={isRequesting}
      countdown={countdown}
    />
  )
})
