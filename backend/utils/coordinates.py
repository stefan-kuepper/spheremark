from typing import Tuple


def geo_to_uv(azimuth: float, altitude: float) -> Tuple[float, float]:
    """
    Convert geographic coordinates to UV coordinates.

    Args:
        azimuth: Azimuth angle in degrees (0-360, 0=north)
        altitude: Altitude angle in degrees (-90 to 90, 0=horizon)

    Returns:
        Tuple of (u, v) coordinates (0.0 to 1.0)
    """
    u = azimuth / 360.0
    v = (90.0 - altitude) / 180.0
    return u, v


def uv_to_geo(u: float, v: float) -> Tuple[float, float]:
    """
    Convert UV coordinates to geographic coordinates.

    Args:
        u: U coordinate (0.0 to 1.0)
        v: V coordinate (0.0 to 1.0)

    Returns:
        Tuple of (azimuth, altitude) in degrees
        - azimuth: 0-360 (0=north)
        - altitude: -90 to 90 (0=horizon)
    """
    azimuth = u * 360.0
    altitude = 90.0 - (v * 180.0)
    return azimuth, altitude


def geo_bbox_to_uv(
    az_min: float, alt_min: float, az_max: float, alt_max: float
) -> dict:
    """
    Convert geographic bounding box to UV coordinates.

    Args:
        az_min, alt_min: Minimum azimuth and altitude (degrees)
        az_max, alt_max: Maximum azimuth and altitude (degrees)

    Returns:
        Dictionary with uv_min_u, uv_min_v, uv_max_u, uv_max_v
    """
    uv_min_u, uv_min_v = geo_to_uv(az_min, alt_max)  # alt_max -> lower v (top)
    uv_max_u, uv_max_v = geo_to_uv(az_max, alt_min)  # alt_min -> higher v (bottom)

    return {
        "uv_min_u": uv_min_u,
        "uv_min_v": uv_min_v,
        "uv_max_u": uv_max_u,
        "uv_max_v": uv_max_v,
    }


def uv_bbox_to_geo(
    uv_min_u: float, uv_min_v: float, uv_max_u: float, uv_max_v: float
) -> dict:
    """
    Convert UV bounding box to geographic coordinates.

    Args:
        uv_min_u, uv_min_v: Minimum UV coordinates
        uv_max_u, uv_max_v: Maximum UV coordinates

    Returns:
        Dictionary with az_min, alt_min, az_max, alt_max (degrees)
    """
    az_min, alt_max = uv_to_geo(uv_min_u, uv_min_v)  # lower v -> higher altitude
    az_max, alt_min = uv_to_geo(uv_max_u, uv_max_v)  # higher v -> lower altitude

    return {
        "az_min": az_min,
        "alt_min": alt_min,
        "az_max": az_max,
        "alt_max": alt_max,
    }
