import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useInteraction } from '../hooks';
import type { BoundingBox } from '../types';

export interface CameraControllerHandle {
  focusOnBox: (box: BoundingBox) => void;
}

const MIN_FOV = 20;
const MAX_FOV = 100;
const ZOOM_SPEED = 0.05;

export const CameraController = forwardRef<CameraControllerHandle, object>(
  function CameraController(_, ref) {
    const { camera, gl } = useThree();
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const { controlsEnabled } = useInteraction();

    // Expose focusOnBox method via ref
    useImperativeHandle(ref, () => ({
      focusOnBox: (box: BoundingBox) => {
        const perspCamera = camera as THREE.PerspectiveCamera;

        // Calculate box center in UV space
        const centerU = (box.uvMin.u + box.uvMax.u) / 2;
        const centerV = (box.uvMin.v + box.uvMax.v) / 2;

        // Convert to spherical coordinates
        const phi = centerU * Math.PI * 2 - Math.PI / 2;
        const theta = centerV * Math.PI;

        // Position camera to look at this point
        const distance = 0.1;
        perspCamera.position.x = distance * Math.sin(theta) * Math.sin(phi);
        perspCamera.position.y = -distance * Math.cos(theta);
        perspCamera.position.z = distance * Math.sin(theta) * Math.cos(phi);

        // Zoom based on box size
        const boxSizeU = box.uvMax.u - box.uvMin.u;
        const boxSizeV = box.uvMax.v - box.uvMin.v;
        const avgBoxSize = (boxSizeU + boxSizeV) / 2;
        const targetFOV = Math.max(MIN_FOV, Math.min(75, avgBoxSize * 500));

        perspCamera.fov = targetFOV;
        perspCamera.updateProjectionMatrix();

        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      },
    }));

    // Handle FOV-based zoom via wheel
    useEffect(() => {
      const handleWheel = (event: WheelEvent) => {
        event.preventDefault();

        const perspCamera = camera as THREE.PerspectiveCamera;
        perspCamera.fov += event.deltaY * ZOOM_SPEED;
        perspCamera.fov = Math.max(MIN_FOV, Math.min(MAX_FOV, perspCamera.fov));
        perspCamera.updateProjectionMatrix();
      };

      const canvas = gl.domElement;
      canvas.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        canvas.removeEventListener('wheel', handleWheel);
      };
    }, [camera, gl]);

    // Set initial camera position
    useEffect(() => {
      camera.position.set(0, 0, 0.1);
    }, [camera]);

    return (
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={-0.5}
        enableZoom={false}
        enablePan={false}
        enabled={controlsEnabled}
      />
    );
  }
);
