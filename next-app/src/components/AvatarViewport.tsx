/**
 * AvatarViewport.tsx — 3D R3F Viewport component.
 * 
 * Sets up R3F canvas context and handles WebGL errors via ErrorBoundary wrapper.
 */
import React from "react";
import { AvatarScene } from "../avatar/AvatarScene";
import { ErrorBoundary } from "./ErrorBoundary";

interface AvatarViewportProps {
  analyserNode: AnalyserNode | null;
}

export const AvatarViewport: React.FC<AvatarViewportProps> = ({ analyserNode }) => {
  return (
    <div className="absolute inset-0 z-0">
      <ErrorBoundary>
        <AvatarScene analyserNode={analyserNode} />
      </ErrorBoundary>
    </div>
  );
};
