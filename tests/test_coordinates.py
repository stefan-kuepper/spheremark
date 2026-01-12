import math
import pytest
from backend.utils.coordinates import (
    uv_to_spherical,
    spherical_to_uv,
    uv_bbox_to_spherical,
    spherical_bbox_to_uv,
)


def test_uv_to_spherical():
    """Test UV to spherical conversion."""
    test_cases = [
        ((0.0, 0.0), (-math.pi, 0.0)),  # Top-left corner
        ((1.0, 1.0), (math.pi, math.pi)),  # Bottom-right corner
        ((0.5, 0.5), (0.0, math.pi / 2)),  # Center
        ((0.25, 0.25), (-math.pi / 2, math.pi / 4)),  # Quarter point
    ]

    for (u, v), expected in test_cases:
        phi, theta = uv_to_spherical(u, v)
        assert abs(phi - expected[0]) < 1e-10, f"Phi mismatch: {phi} != {expected[0]}"
        assert abs(theta - expected[1]) < 1e-10, (
            f"Theta mismatch: {theta} != {expected[1]}"
        )


def test_spherical_to_uv():
    """Test spherical to UV conversion."""
    test_cases = [
        ((-math.pi, 0.0), (0.0, 0.0)),  # Top-left corner
        ((math.pi, math.pi), (1.0, 1.0)),  # Bottom-right corner
        ((0.0, math.pi / 2), (0.5, 0.5)),  # Center
        ((-math.pi / 2, math.pi / 4), (0.25, 0.25)),  # Quarter point
    ]

    for (phi, theta), expected in test_cases:
        u, v = spherical_to_uv(phi, theta)
        assert abs(u - expected[0]) < 1e-10, f"U mismatch: {u} != {expected[0]}"
        assert abs(v - expected[1]) < 1e-10, f"V mismatch: {v} != {expected[1]}"


def test_roundtrip():
    """Test that converting UV -> Spherical -> UV gives back the original."""
    test_uvs = [
        (0.0, 0.0),
        (0.25, 0.25),
        (0.5, 0.5),
        (0.75, 0.75),
        (1.0, 1.0),
        (0.33, 0.67),
    ]

    for orig_u, orig_v in test_uvs:
        phi, theta = uv_to_spherical(orig_u, orig_v)
        u, v = spherical_to_uv(phi, theta)
        assert abs(u - orig_u) < 1e-10, f"U roundtrip mismatch: {u} != {orig_u}"
        assert abs(v - orig_v) < 1e-10, f"V roundtrip mismatch: {v} != {orig_v}"


def test_bbox_conversion():
    """Test bounding box conversion."""
    uv_bbox = {"uv_min_u": 0.25, "uv_min_v": 0.25, "uv_max_u": 0.75, "uv_max_v": 0.75}

    spherical_bbox = uv_bbox_to_spherical(**uv_bbox)

    # Test spherical bbox back to UV
    uv_bbox_back = spherical_bbox_to_uv(**spherical_bbox)

    # Verify roundtrip
    for key in uv_bbox:
        assert abs(uv_bbox[key] - uv_bbox_back[key]) < 1e-10, (
            f"Bbox roundtrip mismatch for {key}"
        )


def test_edge_cases():
    """Test edge cases and boundary conditions."""
    # Test UV values at boundaries
    assert uv_to_spherical(0.0, 0.0) == (-math.pi, 0.0)
    assert uv_to_spherical(1.0, 1.0) == (math.pi, math.pi)

    # Test spherical values at boundaries
    assert spherical_to_uv(-math.pi, 0.0) == (0.0, 0.0)
    assert spherical_to_uv(math.pi, math.pi) == (1.0, 1.0)

    # Test that phi wraps around
    phi1, theta1 = uv_to_spherical(0.0, 0.5)
    phi2, theta2 = uv_to_spherical(1.0, 0.5)
    assert abs(phi1 - (-math.pi)) < 1e-10
    assert abs(phi2 - math.pi) < 1e-10
    assert abs(theta1 - theta2) < 1e-10


@pytest.mark.parametrize(
    "u,v",
    [
        (0.0, 0.0),
        (0.5, 0.5),
        (1.0, 1.0),
        (0.25, 0.75),
    ],
)
def test_roundtrip_parametrized(u, v):
    """Parametrized test for roundtrip conversion."""
    phi, theta = uv_to_spherical(u, v)
    u_back, v_back = spherical_to_uv(phi, theta)
    assert abs(u_back - u) < 1e-10
    assert abs(v_back - v) < 1e-10
