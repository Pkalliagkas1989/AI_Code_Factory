"""Black-box tests for the local marketing count-analysis CLI."""
import json
import subprocess
import sys
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name('analyze.py')


class AnalysisTest(unittest.TestCase):
    def run_cli(self, data):
        return subprocess.run([sys.executable, str(SCRIPT)], input=json.dumps(data),
                              capture_output=True, text=True)

    def data(self, n=100, a=10, b=15):
        return {'control': {'participants': n, 'successes': a},
                'variant': {'participants': n, 'successes': b}}

    def result(self, data):
        r = self.run_cli(data)
        self.assertEqual(r.returncode, 0, r.stderr)
        return json.loads(r.stdout)

    def test_rates_and_descriptive_lift(self):
        r = self.result(self.data())
        self.assertEqual(r['control']['rate'], .1)
        self.assertEqual(r['variant']['rate'], .15)
        self.assertAlmostEqual(r['difference_percentage_points'], 5)
        self.assertAlmostEqual(r['relative_lift'], .5)
        self.assertEqual(r['interpretation'], 'descriptive_only')
        self.assertNotIn('winner', r)

    def test_wilson_known_reference_values(self):
        # NIST Wilson score formula, z=1.959963984540054, k=10, n=100.
        lo, hi = self.result(self.data())['control']['wilson_95']
        self.assertAlmostEqual(lo, .055229137, places=8)
        self.assertAlmostEqual(hi, .174365662, places=8)

    def test_zero_successes_does_not_mean_zero_uncertainty(self):
        r = self.result(self.data(a=0))
        self.assertIsNone(r['relative_lift'])
        self.assertAlmostEqual(r['control']['wilson_95'][0], 0)
        self.assertAlmostEqual(r['control']['wilson_95'][1], .036993498, places=8)

    def test_all_successes_does_not_mean_certainty(self):
        lo, hi = self.result(self.data(a=100))['control']['wilson_95']
        self.assertAlmostEqual(lo, .963006502, places=8)
        self.assertAlmostEqual(hi, 1)

    def test_no_exposures_is_unknown_not_zero_rate(self):
        r = self.result(self.data(n=0, a=0, b=0))
        self.assertIsNone(r['control']['rate'])
        self.assertIsNone(r['control']['wilson_95'])
        self.assertIsNone(r['difference_percentage_points'])
        self.assertIsNone(r['relative_lift'])

    def test_rejects_invalid_counts_without_partial_output(self):
        for n, a in [(100, 101), (-1, 0), (100, -1), (True, 0), (100, False),
                     (100.0, 10), (100, '10'), (100, None)]:
            with self.subTest(n=n, a=a):
                r = self.run_cli(self.data(n=n, a=a))
                self.assertNotEqual(r.returncode, 0)
                self.assertEqual(r.stdout, '')
                self.assertIn('marketing:', r.stderr)

    def test_rejects_missing_or_wrong_shapes(self):
        for data in [None, [], {}, {'control': []},
                     {'control': {}, 'variant': {}},
                     {'control': {'participants': 10}, 'variant': {}}]:
            with self.subTest(data=data):
                r = self.run_cli(data)
                self.assertNotEqual(r.returncode, 0)
                self.assertEqual(r.stdout, '')

    def test_invalid_json_is_a_clear_error(self):
        r = subprocess.run([sys.executable, str(SCRIPT)], input='{',
                           capture_output=True, text=True)
        self.assertNotEqual(r.returncode, 0)
        self.assertEqual(r.stdout, '')
        self.assertIn('marketing:', r.stderr)
        self.assertNotIn('Traceback', r.stderr)


if __name__ == '__main__':
    unittest.main()
