import * as THREE from 'three';
import type { UVCoordinate } from '../types';

const SPHERE_RADIUS = 500;

export function uvTo3D(u: number, v: number, radius: number = SPHERE_RADIUS): THREE.Vector3 {
  // Account for sphere rotation (sphere.rotation.y = Math.PI)
  const phi = u * Math.PI * 2 - Math.PI / 2; // 0-360deg longitude - 90deg offset
  const theta = v * Math.PI; // 0-180deg latitude

  return new THREE.Vector3(
    -radius * Math.sin(theta) * Math.sin(phi),
    radius * Math.cos(theta),
    -radius * Math.sin(theta) * Math.cos(phi)
  );
}

export function generateBoxPoints(
  uvMin: UVCoordinate,
  uvMax: UVCoordinate,
  segments: number = 20
): Float32Array {
  const points: number[] = [];

  // Top edge
  for (let i = 0; i <= segments; i++) {
    const u = uvMin.u + (uvMax.u - uvMin.u) * (i / segments);
    const pos = uvTo3D(u, uvMin.v);
    points.push(pos.x, pos.y, pos.z);
  }

  // Right edge
  for (let i = 1; i <= segments; i++) {
    const v = uvMin.v + (uvMax.v - uvMin.v) * (i / segments);
    const pos = uvTo3D(uvMax.u, v);
    points.push(pos.x, pos.y, pos.z);
  }

  // Bottom edge
  for (let i = 1; i <= segments; i++) {
    const u = uvMax.u - (uvMax.u - uvMin.u) * (i / segments);
    const pos = uvTo3D(u, uvMax.v);
    points.push(pos.x, pos.y, pos.z);
  }

  // Left edge
  for (let i = 1; i < segments; i++) {
    const v = uvMax.v - (uvMax.v - uvMin.v) * (i / segments);
    const pos = uvTo3D(uvMin.u, v);
    points.push(pos.x, pos.y, pos.z);
  }

  return new Float32Array(points);
}

export { SPHERE_RADIUS };
