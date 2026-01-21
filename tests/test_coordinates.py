import pytest
from backend.utils.coordinates import (
    geo_to_uv,
    uv_to_geo,
    geo_bbox_to_uv,
    uv_bbox_to_geo,
)


def test_geo_to_uv():
    """Test geographic to UV conversion."""
    test_cases = [
        # (azimuth, altitude), expected (u, v)
        ((0.0, 90.0), (0.0, 0.0)),  # North, zenith -> top-left
        ((360.0, -90.0), (1.0, 1.0)),  # Full rotation, nadir -> bottom-right
        ((180.0, 0.0), (0.5, 0.5)),  # South, horizon -> center
        ((90.0, 45.0), (0.25, 0.25)),  # East, 45deg up
        ((270.0, -45.0), (0.75, 0.75)),  # West, 45deg down
    ]

    for (azimuth, altitude), expected in test_cases:
        u, v = geo_to_uv(azimuth, altitude)
        assert abs(u - expected[0]) < 1e-10, f"U mismatch for ({azimuth}, {altitude}): {u} != {expected[0]}"
        assert abs(v - expected[1]) < 1e-10, f"V mismatch for ({azimuth}, {altitude}): {v} != {expected[1]}"


def test_uv_to_geo():
    """Test UV to geographic conversion."""
    test_cases = [
        # (u, v), expected (azimuth, altitude)
        ((0.0, 0.0), (0.0, 90.0)),  # Top-left -> north, zenith
        ((1.0, 1.0), (360.0, -90.0)),  # Bottom-right -> full rotation, nadir
        ((0.5, 0.5), (180.0, 0.0)),  # Center -> south, horizon
        ((0.25, 0.25), (90.0, 45.0)),  # Quarter -> east, 45deg up
        ((0.75, 0.75), (270.0, -45.0)),  # 3/4 -> west, 45deg down
    ]

    for (u, v), expected in test_cases:
        azimuth, altitude = uv_to_geo(u, v)
        assert abs(azimuth - expected[0]) < 1e-10, f"Azimuth mismatch for ({u}, {v}): {azimuth} != {expected[0]}"
        assert abs(altitude - expected[1]) < 1e-10, f"Altitude mismatch for ({u}, {v}): {altitude} != {expected[1]}"


def test_roundtrip_geo_to_uv():
    """Test that converting geo -> UV -> geo gives back the original."""
    test_coords = [
        (0.0, 90.0),
        (90.0, 45.0),
        (180.0, 0.0),
        (270.0, -45.0),
        (360.0, -90.0),
        (120.0, 30.0),
    ]

    for orig_az, orig_alt in test_coords:
        u, v = geo_to_uv(orig_az, orig_alt)
        azimuth, altitude = uv_to_geo(u, v)
        assert abs(azimuth - orig_az) < 1e-10, f"Azimuth roundtrip mismatch: {azimuth} != {orig_az}"
        assert abs(altitude - orig_alt) < 1e-10, f"Altitude roundtrip mismatch: {altitude} != {orig_alt}"


def test_roundtrip_uv_to_geo():
    """Test that converting UV -> geo -> UV gives back the original."""
    test_uvs = [
        (0.0, 0.0),
        (0.25, 0.25),
        (0.5, 0.5),
        (0.75, 0.75),
        (1.0, 1.0),
        (0.33, 0.67),
    ]

    for orig_u, orig_v in test_uvs:
        azimuth, altitude = uv_to_geo(orig_u, orig_v)
        u, v = geo_to_uv(azimuth, altitude)
        assert abs(u - orig_u) < 1e-10, f"U roundtrip mismatch: {u} != {orig_u}"
        assert abs(v - orig_v) < 1e-10, f"V roundtrip mismatch: {v} != {orig_v}"


def test_bbox_conversion():
    """Test bounding box conversion."""
    geo_bbox = {
        "az_min": 90.0,
        "alt_min": -45.0,
        "az_max": 270.0,
        "alt_max": 45.0,
    }

    uv_bbox = geo_bbox_to_uv(**geo_bbox)

    # Test UV bbox back to geo
    geo_bbox_back = uv_bbox_to_geo(**uv_bbox)

    # Verify roundtrip
    for key in geo_bbox:
        assert abs(geo_bbox[key] - geo_bbox_back[key]) < 1e-10, (
            f"Bbox roundtrip mismatch for {key}: {geo_bbox[key]} != {geo_bbox_back[key]}"
        )


def test_bbox_uv_ordering():
    """Test that bbox UV conversion produces correct min/max ordering."""
    geo_bbox = {
        "az_min": 90.0,
        "alt_min": -30.0,
        "az_max": 180.0,
        "alt_max": 30.0,
    }

    uv_bbox = geo_bbox_to_uv(**geo_bbox)

    # Check that UV min < max for both coordinates
    assert uv_bbox["uv_min_u"] < uv_bbox["uv_max_u"], "uv_min_u should be less than uv_max_u"
    assert uv_bbox["uv_min_v"] < uv_bbox["uv_max_v"], "uv_min_v should be less than uv_max_v"


def test_edge_cases():
    """Test edge cases and boundary conditions."""
    # Test at boundaries
    assert geo_to_uv(0.0, 90.0) == (0.0, 0.0)  # North pole
    assert geo_to_uv(0.0, -90.0) == (0.0, 1.0)  # South pole
    assert geo_to_uv(0.0, 0.0) == (0.0, 0.5)  # Horizon at north

    # Test conversion boundaries
    assert uv_to_geo(0.0, 0.0) == (0.0, 90.0)
    assert uv_to_geo(1.0, 1.0) == (360.0, -90.0)
    assert uv_to_geo(0.5, 0.5) == (180.0, 0.0)


@pytest.mark.parametrize(
    "azimuth,altitude",
    [
        (0.0, 90.0),
        (180.0, 0.0),
        (360.0, -90.0),
        (90.0, -45.0),
    ],
)
def test_roundtrip_parametrized(azimuth, altitude):
    """Parametrized test for roundtrip conversion."""
    u, v = geo_to_uv(azimuth, altitude)
    az_back, alt_back = uv_to_geo(u, v)
    assert abs(az_back - azimuth) < 1e-10
    assert abs(alt_back - altitude) < 1e-10
