import React, { useEffect, useRef } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { useGazeStore } from '../state/gazeStore';

/**
 * EyeGazeTracker – captures webcam video, runs MediaPipe FaceMesh, and updates the
 * global gaze store with normalized screen coordinates (-1 to 1).
 *
 * The component does not render anything itself; it only creates a hidden video
 * element. It should be mounted once at the top level of the app.
 */
export const EyeGazeTracker: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const setGaze = useGazeStore((s) => s.setGaze);

  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    faceMesh.onResults((results) => {
      if (!results.multiFaceLandmarks?.length) return;
      const landmarks = results.multiFaceLandmarks[0];
      // Use eye center (average of landmarks 33 and 263) as gaze point
      const left = landmarks[33];
      const right = landmarks[263];
      const eyeCenter = {
        x: (left.x + right.x) / 2,
        y: (left.y + right.y) / 2,
      };
      // Convert from [0,1] image coords to NDC [-1,1]
      const ndcX = eyeCenter.x * 2 - 1;
      const ndcY = -(eyeCenter.y * 2 - 1);
      setGaze(ndcX, ndcY);
    });

    const camera = new Camera(video, {
      onFrame: async () => {
        await faceMesh.send({ image: video });
      },
      width: 640,
      height: 480,
    });
    camera.start();

    return () => {
      camera.stop();
      if (video.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, [setGaze]);

  // Hidden video element – we keep it in the DOM so MediaPipe can read frames.
  return <video ref={videoRef} style={{ display: 'none' }} autoPlay muted playsInline />;
};
