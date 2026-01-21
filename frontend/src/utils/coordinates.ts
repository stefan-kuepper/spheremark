import * as THREE from 'three';
import type { GeoCoordinate } from '../types';

const SPHERE_RADIUS = 500;

/**
 * Convert geographic coordinates to UV coordinates.
 * @param azimuth - Azimuth in degrees (0-360, 0=north)
 * @param altitude - Altitude in degrees (-90 to 90, 0=horizon)
 * @returns UV coordinates (0-1)
 */
export function geoToUV(azimuth: number, altitude: number): { u: number; v: number } {
  const u = azimuth / 360;
  const v = (90 - altitude) / 180;
  return { u, v };
}

/**
 * Convert UV coordinates to geographic coordinates.
 * @param u - U coordinate (0-1)
 * @param v - V coordinate (0-1)
 * @returns Geographic coordinates in degrees
 */
export function uvToGeo(u: number, v: number): GeoCoordinate {
  const azimuth = u * 360;
  const altitude = 90 - v * 180;
  return { azimuth, altitude };
}

/**
 * Convert geographic coordinates to 3D position on sphere.
 * @param azimuth - Azimuth in degrees (0-360)
 * @param altitude - Altitude in degrees (-90 to 90)
 * @param radius - Sphere radius
 * @returns THREE.Vector3 position
 */
export function geoTo3D(
  azimuth: number,
  altitude: number,
  radius: number = SPHERE_RADIUS
): THREE.Vector3 {
  // Convert to UV first, then to 3D
  const { u, v } = geoToUV(azimuth, altitude);

  // Account for sphere rotation (sphere.rotation.y = Math.PI)
  const phi = u * Math.PI * 2 - Math.PI / 2; // 0-360deg longitude - 90deg offset
  const theta = v * Math.PI; // 0-180deg latitude

  return new THREE.Vector3(
    -radius * Math.sin(theta) * Math.sin(phi),
    radius * Math.cos(theta),
    -radius * Math.sin(theta) * Math.cos(phi)
  );
}

/**
 * Generate points for a bounding box on the sphere surface.
 * @param geoMin - Minimum geographic coordinates (min azimuth, min altitude)
 * @param geoMax - Maximum geographic coordinates (max azimuth, max altitude)
 * @param segments - Number of segments per edge
 * @returns Float32Array of 3D positions
 */
export function generateBoxPoints(
  geoMin: GeoCoordinate,
  geoMax: GeoCoordinate,
  segments: number = 20
): Float32Array {
  const points: number[] = [];

  // Top edge (max altitude)
  for (let i = 0; i <= segments; i++) {
    const azimuth = geoMin.azimuth + (geoMax.azimuth - geoMin.azimuth) * (i / segments);
    const pos = geoTo3D(azimuth, geoMax.altitude);
    points.push(pos.x, pos.y, pos.z);
  }

  // Right edge (max azimuth)
  for (let i = 1; i <= segments; i++) {
    const altitude = geoMax.altitude - (geoMax.altitude - geoMin.altitude) * (i / segments);
    const pos = geoTo3D(geoMax.azimuth, altitude);
    points.push(pos.x, pos.y, pos.z);
  }

  // Bottom edge (min altitude)
  for (let i = 1; i <= segments; i++) {
    const azimuth = geoMax.azimuth - (geoMax.azimuth - geoMin.azimuth) * (i / segments);
    const pos = geoTo3D(azimuth, geoMin.altitude);
    points.push(pos.x, pos.y, pos.z);
  }

  // Left edge (min azimuth)
  for (let i = 1; i < segments; i++) {
    const altitude = geoMin.altitude + (geoMax.altitude - geoMin.altitude) * (i / segments);
    const pos = geoTo3D(geoMin.azimuth, altitude);
    points.push(pos.x, pos.y, pos.z);
  }

  return new Float32Array(points);
}

export { SPHERE_RADIUS };
