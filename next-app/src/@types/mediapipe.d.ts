// Type declarations for Mediapipe packages used in the project.

declare module '@mediapipe/face_mesh' {
  export class FaceMesh {
    constructor(options?: { locateFile?: (path: string) => string });
    setOptions(options: {
      maxNumFaces?: number;
      refineLandmarks?: boolean;
      minDetectionConfidence?: number;
      minTrackingConfidence?: number;
    }): void;
    onResults(callback: (results: FaceMeshResults) => void): void;
    send(input: { image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement }): void;
    close(): void;
  }

  export interface FaceMeshResults {
    image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;
    multiFaceLandmarks?: NormalizedLandmark[];
    // Additional fields can be added as needed.
  }

  export interface NormalizedLandmark {
    x: number;
    y: number;
    z: number;
    visibility?: number;
  }
}

declare module '@mediapipe/camera_utils' {
  export class Camera {
    constructor(videoElement: HTMLVideoElement, options: {
      onFrame: (video: HTMLVideoElement) => void;
      width?: number;
      height?: number;
    });
    start(): void;
    stop(): void;
  }
}
