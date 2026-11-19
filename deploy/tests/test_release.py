"""Exercise the real Bash scripts with fake cloud commands; no live cloud calls."""
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
BASH = shutil.which('bash')
if os.name == 'nt':
    BASH = r'C:\Program Files\Git\bin\bash.exe'

STUB = r"""#!/usr/bin/env bash
set -eu
printf '%s ' "$@" >> "$STUB_LOG"
printf '\n' >> "$STUB_LOG"
case "$*" in
  'artifacts docker images describe '*) printf '%s\n' "$STUB_DIGEST" ;;
  'run jobs execute '*) exit "${STUB_MIGRATE_EXIT:-0}" ;;
  'run services describe '*--format=json*) printf '{"status":{"traffic":[{"revisionName":"%s","percent":100}]}}\n' "${STUB_TRAFFIC_REVISION:-scd928edd-00001-test}" ;;
  'run services describe '*status.latestReadyRevisionName*) echo scd928edd-00001-test ;;
  'run services describe '*status.url*) echo https://scd928edd-test.asia-southeast1.run.app ;;
  'run revisions describe '*) printf '%s\n' "${STUB_SERVING_DIGEST:-$STUB_DIGEST}" ;;
esac
"""


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='lab5-script-')
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)
        self.log = self.directory / 'calls.log'
        self.log.write_text('')
        for name in ['gcloud', 'docker']:
            stub = self.directory / name
            stub.write_text(STUB, encoding='utf-8', newline='\n')
            stub.chmod(0o755)
        self.env = dict(os.environ,
                        PROJECT_ID='cpe-se-course-2026', REGION='asia-southeast1',
                        IMAGE_TAG='1' * 40, DRY_RUN='0', ROLLBACK='false', SEED_DEMO_DATA='false',
                        SERVICE_NAME='scd928edd', MIGRATE_JOB_NAME='scd928edd-migrate',
                        STUB_DIR=self.directory.as_posix(), STUB_LOG=self.log.as_posix(),
                        STUB_DIGEST='asia-southeast1-docker.pkg.dev/cpe-se-course-2026/scd928edd/scd928edd@sha256:' + 'a' * 64,
                        PYTHON=Path(sys.executable).as_posix())
        self.env.pop('GITHUB_ENV', None)

    def run_script(self, script='deploy/release.sh', args=''):
        # Git Bash converts the stub directory once; Linux uses the native path.
        prefix = 'd="$STUB_DIR"; if command -v cygpath >/dev/null; then d="$(cygpath -u "$d")"; fi; export PATH="$d:$PATH"; '
        return subprocess.run([BASH, '-c', prefix + 'bash ' + script + ' ' + args],
                              cwd=ROOT, env=self.env, text=True, capture_output=True, timeout=30)

    def test_normal_release_migrates_before_service_and_pins_digest(self):
        result = self.run_script()
        self.assertEqual(result.returncode, 0, result.stderr)
        calls = self.log.read_text()
        self.assertLess(calls.index('run jobs execute'), calls.index('run services update scd928edd '))
        self.assertEqual(calls.count('--image ' + self.env['STUB_DIGEST']), 2)
        self.assertIn('PUBLIC_ORIGIN=https://scd928edd-test.asia-southeast1.run.app', calls)
        self.assertNotIn('--set-env-vars', calls)
        self.assertNotIn('--set-secrets', calls)
        self.assertNotIn('db:seed', calls)

    def test_migration_failure_blocks_service_and_traffic_updates(self):
        self.env['STUB_MIGRATE_EXIT'] = '42'
        result = self.run_script()
        self.assertNotEqual(result.returncode, 0)
        calls = self.log.read_text()
        self.assertNotIn('run services update ', calls)
        self.assertNotIn('run services update-traffic', calls)

    def test_rollback_does_not_migrate_seed_or_build(self):
        self.env['ROLLBACK'] = 'true'
        result = self.run_script()
        self.assertEqual(result.returncode, 0, result.stderr)
        calls = self.log.read_text()
        self.assertNotIn('run jobs update', calls)
        self.assertNotIn('run jobs execute', calls)
        self.assertNotIn('db:seed', calls)
        self.assertNotIn('--update-env-vars', calls)
        self.assertNotIn('build', calls)
        self.assertIn('run services update scd928edd ', calls)

    def test_initial_seed_uses_all_four_existing_secret_slots(self):
        self.env['SEED_DEMO_DATA'] = 'true'
        result = self.run_script()
        self.assertEqual(result.returncode, 0, result.stderr)
        calls = self.log.read_text()
        self.assertIn('npm run db:migrate && npm run db:seed', calls)
        for slot in range(1, 5):
            self.assertIn(f'scd928edd-app-secret-{slot}:latest', calls)
        self.assertNotIn('versions access', calls)

    def test_wrong_project_or_team_is_refused_before_cloud_calls(self):
        for key, value in [('PROJECT_ID', 'another-project'), ('SERVICE_NAME', 'another-team'), ('IMAGE_TAG', 'latest')]:
            with self.subTest(key=key):
                old = self.env[key]
                self.env[key] = value
                result = self.run_script()
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(self.log.read_text(), '')
                self.env[key] = old

    def test_image_from_another_registry_is_refused(self):
        self.env['STUB_DIGEST'] = self.env['STUB_DIGEST'].replace('/scd928edd/scd928edd@', '/other/other@')
        result = self.run_script()
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn('run jobs update', self.log.read_text())

    def test_serving_digest_must_match(self):
        self.env['STUB_SERVING_DIGEST'] = self.env['STUB_DIGEST'].replace('a' * 64, 'b' * 64)
        result = self.run_script()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Serving image differs', result.stderr)

    def test_latest_revision_must_receive_all_traffic(self):
        self.env['STUB_TRAFFIC_REVISION'] = 'scd928edd-old'
        result = self.run_script()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('not serving all traffic', result.stderr)

    def test_preview_never_invokes_cloud_or_docker(self):
        self.env['DRY_RUN'] = '1'
        result = self.run_script('deploy/deploy.sh', '--demo')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.log.read_text(), '')
        self.assertIn('Preview completed', result.stdout)

    def test_rollback_with_seed_is_refused_before_cloud_calls(self):
        self.env.update(ROLLBACK='true', SEED_DEMO_DATA='true')
        result = self.run_script()
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.log.read_text(), '')


if __name__ == '__main__':
    unittest.main()
