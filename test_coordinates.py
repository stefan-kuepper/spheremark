#!/usr/bin/env python3
"""
Simple test script for coordinate conversion functions.
Run: uv run python test_coordinates.py
"""

import math
from backend.utils.coordinates import (
    uv_to_spherical,
    spherical_to_uv,
    uv_bbox_to_spherical,
    spherical_bbox_to_uv
)


def test_uv_to_spherical():
    """Test UV to spherical conversion."""
    print("Testing UV to Spherical conversion:")

    test_cases = [
        ((0.0, 0.0), (-math.pi, 0.0)),          # Top-left corner
        ((1.0, 1.0), (math.pi, math.pi)),       # Bottom-right corner
        ((0.5, 0.5), (0.0, math.pi/2)),         # Center
        ((0.25, 0.25), (-math.pi/2, math.pi/4)), # Quarter point
    ]

    for (u, v), expected in test_cases:
        phi, theta = uv_to_spherical(u, v)
        print(f"  UV({u:.2f}, {v:.2f}) → Spherical(φ={phi:.4f}, θ={theta:.4f}) [Expected: φ={expected[0]:.4f}, θ={expected[1]:.4f}]")

        # Verify
        assert abs(phi - expected[0]) < 1e-10, f"Phi mismatch: {phi} != {expected[0]}"
        assert abs(theta - expected[1]) < 1e-10, f"Theta mismatch: {theta} != {expected[1]}"

    print("  ✓ All UV to Spherical tests passed\n")


def test_spherical_to_uv():
    """Test spherical to UV conversion."""
    print("Testing Spherical to UV conversion:")

    test_cases = [
        ((-math.pi, 0.0), (0.0, 0.0)),          # Top-left corner
        ((math.pi, math.pi), (1.0, 1.0)),       # Bottom-right corner
        ((0.0, math.pi/2), (0.5, 0.5)),         # Center
        ((-math.pi/2, math.pi/4), (0.25, 0.25)), # Quarter point
    ]

    for (phi, theta), expected in test_cases:
        u, v = spherical_to_uv(phi, theta)
        print(f"  Spherical(φ={phi:.4f}, θ={theta:.4f}) → UV({u:.2f}, {v:.2f}) [Expected: UV({expected[0]:.2f}, {expected[1]:.2f})]")

        # Verify
        assert abs(u - expected[0]) < 1e-10, f"U mismatch: {u} != {expected[0]}"
        assert abs(v - expected[1]) < 1e-10, f"V mismatch: {v} != {expected[1]}"

    print("  ✓ All Spherical to UV tests passed\n")


def test_roundtrip():
    """Test that converting UV -> Spherical -> UV gives back the original."""
    print("Testing roundtrip conversion:")

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

        print(f"  UV({orig_u:.2f}, {orig_v:.2f}) → Spherical → UV({u:.2f}, {v:.2f})")

        assert abs(u - orig_u) < 1e-10, f"U roundtrip mismatch: {u} != {orig_u}"
        assert abs(v - orig_v) < 1e-10, f"V roundtrip mismatch: {v} != {orig_v}"

    print("  ✓ All roundtrip tests passed\n")


def test_bbox_conversion():
    """Test bounding box conversion."""
    print("Testing bounding box conversion:")

    # Test UV bbox to spherical
    uv_bbox = {
        "uv_min_u": 0.25,
        "uv_min_v": 0.25,
        "uv_max_u": 0.75,
        "uv_max_v": 0.75
    }

    spherical_bbox = uv_bbox_to_spherical(**uv_bbox)
    print(f"  UV bbox: {uv_bbox}")
    print(f"  Spherical bbox: {spherical_bbox}")

    # Test spherical bbox back to UV
    uv_bbox_back = spherical_bbox_to_uv(**spherical_bbox)
    print(f"  UV bbox (roundtrip): {uv_bbox_back}")

    # Verify roundtrip
    for key in uv_bbox:
        assert abs(uv_bbox[key] - uv_bbox_back[key]) < 1e-10, f"Bbox roundtrip mismatch for {key}"

    print("  ✓ Bounding box conversion tests passed\n")


if __name__ == "__main__":
    print("=" * 60)
    print("Coordinate Conversion Tests")
    print("=" * 60 + "\n")

    try:
        test_uv_to_spherical()
        test_spherical_to_uv()
        test_roundtrip()
        test_bbox_conversion()

        print("=" * 60)
        print("✓ ALL TESTS PASSED!")
        print("=" * 60)
    except AssertionError as e:
        print(f"\n✗ TEST FAILED: {e}")
        exit(1)
