"""Regressions for npm recovery without suppressing real installation failures."""
# cspell:ignore ETARGET EBADENGINE

import contextlib
import io
import os
import subprocess
import unittest
from unittest.mock import call, patch

import install_precommit_hooks as installer


MISSING_TARBALL = (
    "npm error code E404\n"
    "npm error 404 Not Found - GET https://registry.npmjs.org/"
    "@cspell/dict-software-terms/-/dict-software-terms-5.4.6.tgz - Not found\n"
)


class HookPreparation(unittest.TestCase):
    def prepare(self, outcomes, release_age_days=1):
        with (
            patch.object(installer.subprocess, "run", side_effect=outcomes) as run,
            patch.object(installer.time, "sleep") as sleep,
            contextlib.redirect_stdout(io.StringIO()) as output,
        ):
            code = installer.install_hooks(release_age_days)
        return code, run, sleep, output.getvalue()

    def result(self, code, output=""):
        return subprocess.CompletedProcess([], code, output)

    def test_success_installs_once_and_never_runs_validation(self):
        code, run, sleep, _ = self.prepare([self.result(0)])
        self.assertEqual(code, 0)
        self.assertEqual(run.call_count, 1)
        self.assertEqual(run.call_args.args[0][-1], "install-hooks")
        self.assertNotIn("--all-files", run.call_args.args[0])
        sleep.assert_not_called()

    def test_scheduled_cspell_tarball_failure_recovers_and_keeps_the_log(self):
        code, run, sleep, output = self.prepare(
            [self.result(3, MISSING_TARBALL), self.result(0)]
        )
        self.assertEqual(code, 0)
        self.assertEqual(run.call_count, 2)
        sleep.assert_called_once_with(60)
        self.assertIn(MISSING_TARBALL, output)
        self.assertIn("recovered on attempt 2", output)

    def test_persistent_download_failure_stays_failed_after_three_attempts(self):
        code, run, sleep, _ = self.prepare([self.result(3, MISSING_TARBALL)] * 3)
        self.assertEqual(code, 3)
        self.assertEqual(run.call_count, 3)
        self.assertEqual(sleep.call_args_list, [call(60), call(120)])

    def test_missing_metadata_versions_auth_and_config_fail_immediately(self):
        errors = (
            "npm error code E404\nnpm error 404 Not Found - GET "
            "https://registry.npmjs.org/nonexistent-package - Not found\n",
            "npm error code ETARGET\nNo matching version found\n",
            "npm error code E401\nAuthentication required\n",
            "npm error code E403\nForbidden\n",
            "npm error code ERESOLVE\nDependency conflict\n",
            "npm error code EBADENGINE\nUnsupported engine\n",
            "InvalidConfigError: hook configuration is invalid\n",
        )
        for error in errors:
            with self.subTest(error=error):
                code, run, sleep, _ = self.prepare([self.result(3, error)])
                self.assertEqual(code, 3)
                self.assertEqual(run.call_count, 1)
                sleep.assert_not_called()

    def test_recognized_network_and_registry_failures_can_recover(self):
        for error in ("EAI_AGAIN", "ECONNRESET", "ETIMEDOUT", "E429", "E503"):
            with self.subTest(error=error):
                code, run, sleep, _ = self.prepare(
                    [self.result(3, f"npm error code {error}\n"), self.result(0)]
                )
                self.assertEqual(code, 0)
                self.assertEqual(run.call_count, 2)
                sleep.assert_called_once_with(60)

    def test_configuration_error_after_a_download_failure_stops_retries(self):
        code, run, sleep, _ = self.prepare(
            [self.result(3, MISSING_TARBALL), self.result(2, "InvalidConfigError\n")]
        )
        self.assertEqual(code, 2)
        self.assertEqual(run.call_count, 2)
        sleep.assert_called_once_with(60)

    def test_colored_npm_errors_are_classified(self):
        self.assertTrue(
            installer.retryable_download_error(f"\x1b[31m{MISSING_TARBALL}\x1b[0m")
        )

    def test_release_age_reaches_the_child_without_changing_parent_environment(self):
        with patch.dict(os.environ, {"NPM_CONFIG_MIN_RELEASE_AGE": "0"}):
            code, run, _, _ = self.prepare([self.result(0)])
            self.assertEqual(code, 0)
            environment = run.call_args.kwargs["env"]
            self.assertEqual(environment["npm_config_min_release_age"], "1")
            self.assertNotIn("NPM_CONFIG_MIN_RELEASE_AGE", environment)
            self.assertEqual(os.environ["NPM_CONFIG_MIN_RELEASE_AGE"], "0")

    def test_an_explicit_urgent_exception_reaches_npm(self):
        _, run, _, _ = self.prepare([self.result(0)], release_age_days=0)
        self.assertEqual(run.call_args.kwargs["env"]["npm_config_min_release_age"], "0")

    def test_cache_does_not_reuse_tools_from_a_different_release_age_policy(self):
        with patch.object(installer.subprocess, "check_output", return_value="24.21.0\n"):
            self.assertNotEqual(installer.cache_key(1), installer.cache_key(0))


if __name__ == "__main__":
    unittest.main()
