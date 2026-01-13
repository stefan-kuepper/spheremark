import math
from typing import Tuple


def uv_to_spherical(u: float, v: float) -> Tuple[float, float]:
    """
    Convert UV coordinates to spherical angles.

    Args:
        u: U coordinate (0.0 to 1.0) representing longitude
        v: V coordinate (0.0 to 1.0) representing latitude

    Returns:
        Tuple of (phi, theta) in radians:
        - phi: Longitude [-π, π]
        - theta: Latitude [0, π]
    """
    phi = (u * 2 * math.pi) - math.pi  # U [0,1] → φ [-π, π]
    theta = v * math.pi  # V [0,1] → θ [0, π]
    return phi, theta


def spherical_to_uv(phi: float, theta: float) -> Tuple[float, float]:
    """
    Convert spherical angles to UV coordinates.

    Args:
        phi: Longitude in radians [-π, π]
        theta: Latitude in radians [0, π]

    Returns:
        Tuple of (u, v) coordinates (0.0 to 1.0)
    """
    u = (phi + math.pi) / (2 * math.pi)
    v = theta / math.pi
    return u, v


def uv_bbox_to_spherical(
    uv_min_u: float, uv_min_v: float, uv_max_u: float, uv_max_v: float
) -> dict:
    """
    Convert UV bounding box to spherical coordinates.

    Args:
        uv_min_u, uv_min_v: Minimum UV coordinates
        uv_max_u, uv_max_v: Maximum UV coordinates

    Returns:
        Dictionary with phi_min, theta_min, phi_max, theta_max
    """
    phi_min, theta_min = uv_to_spherical(uv_min_u, uv_min_v)
    phi_max, theta_max = uv_to_spherical(uv_max_u, uv_max_v)

    return {
        "phi_min": phi_min,
        "theta_min": theta_min,
        "phi_max": phi_max,
        "theta_max": theta_max,
    }


def spherical_bbox_to_uv(
    phi_min: float, theta_min: float, phi_max: float, theta_max: float
) -> dict:
    """
    Convert spherical bounding box to UV coordinates.

    Args:
        phi_min, theta_min: Minimum spherical angles (radians)
        phi_max, theta_max: Maximum spherical angles (radians)

    Returns:
        Dictionary with uv_min_u, uv_min_v, uv_max_u, uv_max_v
    """
    uv_min_u, uv_min_v = spherical_to_uv(phi_min, theta_min)
    uv_max_u, uv_max_v = spherical_to_uv(phi_max, theta_max)

    return {
        "uv_min_u": uv_min_u,
        "uv_min_v": uv_min_v,
        "uv_max_u": uv_max_u,
        "uv_max_v": uv_max_v,
    }
