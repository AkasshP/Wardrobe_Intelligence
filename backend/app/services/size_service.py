"""
Size matching — maps body measurements to clothing sizes.
Uses standard size charts for Men and Women.
"""

# Size charts: measurement ranges in inches
# Format: {size: {chest: (min, max), waist: (min, max), hips: (min, max)}}

MEN_SIZES = {
    "XS": {"chest": (32, 34), "waist": (26, 28), "hips": (32, 34)},
    "S":  {"chest": (34, 36), "waist": (28, 30), "hips": (34, 36)},
    "M":  {"chest": (36, 38), "waist": (30, 32), "hips": (36, 38)},
    "L":  {"chest": (38, 40), "waist": (32, 34), "hips": (38, 40)},
    "XL": {"chest": (40, 42), "waist": (34, 36), "hips": (40, 42)},
    "XXL":{"chest": (42, 46), "waist": (36, 40), "hips": (42, 46)},
}

WOMEN_SIZES = {
    "XS": {"chest": (30, 32), "waist": (24, 26), "hips": (32, 34)},
    "S":  {"chest": (32, 34), "waist": (26, 28), "hips": (34, 36)},
    "M":  {"chest": (34, 36), "waist": (28, 30), "hips": (36, 38)},
    "L":  {"chest": (36, 38), "waist": (30, 32), "hips": (38, 40)},
    "XL": {"chest": (38, 40), "waist": (32, 34), "hips": (40, 42)},
    "XXL":{"chest": (40, 44), "waist": (34, 38), "hips": (42, 46)},
}


def measurements_to_size(chest: float, waist: float, hips: float, gender: str = "Men") -> dict:
    """
    Map body measurements to best-fit size.

    Returns:
        {
            "recommended_size": "M",
            "all_fits": {"S": 0.7, "M": 0.95, "L": 0.8},
            "chart": "men" | "women"
        }
    """
    chart = MEN_SIZES if gender in ("Men", "Boys", "Unisex") else WOMEN_SIZES
    chart_name = "men" if gender in ("Men", "Boys", "Unisex") else "women"

    fits = {}
    for size, ranges in chart.items():
        chest_fit = _range_fit(chest, ranges["chest"])
        waist_fit = _range_fit(waist, ranges["waist"])
        hip_fit = _range_fit(hips, ranges["hips"])

        # Weighted: chest 40%, waist 35%, hips 25%
        total = chest_fit * 0.40 + waist_fit * 0.35 + hip_fit * 0.25
        fits[size] = round(total, 2)

    best_size = max(fits, key=fits.get)

    return {
        "recommended_size": best_size,
        "all_fits": fits,
        "chart": chart_name,
    }


def _range_fit(value: float, range_tuple: tuple[float, float]) -> float:
    """Calculate how well a value fits within a range. Returns 0.0 to 1.0."""
    low, high = range_tuple
    if low <= value <= high:
        # Perfect fit — closer to center = higher score
        center = (low + high) / 2
        max_dist = (high - low) / 2
        dist = abs(value - center)
        return 1.0 - (dist / max_dist) * 0.1  # 0.9 to 1.0

    # Outside range — penalize by distance
    if value < low:
        dist = low - value
    else:
        dist = value - high

    return max(0.0, 1.0 - dist / 4.0)  # drops to 0 at 4 inches off
