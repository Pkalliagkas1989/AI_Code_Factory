#!/usr/bin/env python3
"""Describe two cohorts' binary outcomes; never choose a campaign winner.

Input: {"control": {"participants": 100, "successes": 10},
        "variant": {"participants": 100, "successes": 15}}
Method and limits: ../references/measurement.md (Wilson 1927; NIST).
"""
import argparse
import json
import math
import sys
from pathlib import Path

Z95 = 1.959963984540054


def cohort(value, name):
    if not isinstance(value, dict):
        raise ValueError(f'{name} must be an object')
    n, k = value.get('participants'), value.get('successes')
    if type(n) is not int or type(k) is not int or not 0 <= k <= n:
        raise ValueError(f'{name}: require integer counts with 0 <= successes <= participants')
    if n == 0:
        return {'participants': n, 'successes': k, 'rate': None, 'wilson_95': None}
    p = k / n
    z2 = Z95 ** 2
    denominator = 1 + z2 / n
    center = (p + z2 / (2 * n)) / denominator
    half = Z95 * math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / denominator
    return {'participants': n, 'successes': k, 'rate': p,
            'wilson_95': [max(0, center - half), min(1, center + half)]}


def analyze(data):
    if not isinstance(data, dict):
        raise ValueError('input must contain control and variant objects')
    control = cohort(data.get('control'), 'control')
    variant = cohort(data.get('variant'), 'variant')
    a, b = control['rate'], variant['rate']
    difference = b - a if a is not None and b is not None else None
    return {'control': control, 'variant': variant,
            'difference_percentage_points': difference * 100 if difference is not None else None,
            'relative_lift': difference / a if difference is not None and a else None,
            'interpretation': 'descriptive_only',
            'method': 'Wilson 95% per-cohort intervals (Wilson 1927; NIST)',
            'limits': 'Intervals are for each rate, not the difference. No significance, '
                      'power, randomization, attribution or winner assessment is performed.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', nargs='?', default='-', help='local JSON file, or - for stdin')
    args = parser.parse_args()
    try:
        text = sys.stdin.read() if args.input == '-' else Path(args.input).read_text()
        result = analyze(json.loads(text))
    except (OSError, ValueError, OverflowError) as exc:
        print(f'marketing: {exc}', file=sys.stderr)
        return 1
    print(json.dumps(result, indent=2, allow_nan=False))
    return 0


if __name__ == '__main__':
    sys.exit(main())
