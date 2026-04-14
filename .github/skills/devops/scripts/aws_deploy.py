#!/usr/bin/env python3
"""AWS Deployment Automation Script.

Deploys applications to AWS Lambda (CloudFormation), ECS Fargate, or S3 static sites.

Usage:
    python aws_deploy.py --target lambda --env production
    python aws_deploy.py --target ecs --env staging --dry-run
    python aws_deploy.py --target s3 --region us-east-1 --verbose
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path


class AWSDeployError(Exception):
    """Custom exception for AWS deployment errors."""
    pass


class AWSDeployer:
    """Orchestrates deployments to AWS Lambda, ECS Fargate, or S3."""

    VALID_TARGETS = ("lambda", "ecs", "s3")

    def __init__(
        self,
        project_dir=".",
        target="lambda",
        env=None,
        region=None,
        dry_run=False,
        verbose=False,
    ):
        self.project_dir = Path(project_dir).resolve()
        self.target = target
        self.env = env
        self.region = region
        self.dry_run = dry_run
        self.verbose = verbose

        if self.target not in self.VALID_TARGETS:
            raise AWSDeployError(
                f"Invalid target '{self.target}'. Choose from: {', '.join(self.VALID_TARGETS)}"
            )

    def validate_project(self):
        """Check project directory exists and has required files for the target."""
        if not self.project_dir.exists():
            raise AWSDeployError(f"Project directory does not exist: {self.project_dir}")

        if not self.project_dir.is_dir():
            raise AWSDeployError(f"Project path is not a directory: {self.project_dir}")

        if self.target == "lambda":
            template_yaml = self.project_dir / "template.yaml"
            template_json = self.project_dir / "template.json"
            if not template_yaml.exists() and not template_json.exists():
                raise AWSDeployError(
                    f"Lambda target requires a CloudFormation template "
                    f"(template.yaml or template.json) in {self.project_dir}"
                )

        elif self.target == "ecs":
            dockerfile = self.project_dir / "Dockerfile"
            compose_file = self.project_dir / "docker-compose.yml"
            if not dockerfile.exists() and not compose_file.exists():
                raise AWSDeployError(
                    f"ECS target requires a Dockerfile or docker-compose.yml in {self.project_dir}"
                )

        elif self.target == "s3":
            dist_dir = self.project_dir / "dist"
            build_dir = self.project_dir / "build"
            public_dir = self.project_dir / "public"
            if not dist_dir.exists() and not build_dir.exists() and not public_dir.exists():
                raise AWSDeployError(
                    f"S3 target requires a build output directory "
                    f"(dist/, build/, or public/) in {self.project_dir}"
                )

        if self.verbose:
            print(f"Project validation passed for target '{self.target}': {self.project_dir}")

    def check_aws_cli_installed(self):
        """Verify AWS CLI is available on PATH."""
        try:
            result = subprocess.run(
                ["aws", "--version"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True,
            )
            if self.verbose:
                version_output = (result.stdout or result.stderr).decode().strip()
                print(f"AWS CLI found: {version_output}")
        except FileNotFoundError:
            raise AWSDeployError(
                "AWS CLI not found. Install it from https://aws.amazon.com/cli/"
            )
        except subprocess.CalledProcessError as exc:
            raise AWSDeployError(f"AWS CLI check failed: {exc.stderr.decode().strip()}")

    def get_stack_name(self):
        """Derive the CloudFormation stack name from template or directory name.

        Priority:
        1. Top-level 'StackName' parameter in the CloudFormation template
        2. 'Description' field used as identifier (first word)
        3. Parent directory name sanitised for CloudFormation naming rules
        """
        template_path = self.project_dir / "template.yaml"
        if not template_path.exists():
            template_path = self.project_dir / "template.json"

        if template_path.exists():
            try:
                content = template_path.read_text(encoding="utf-8")

                # Try to find an explicit StackName parameter
                for line in content.splitlines():
                    stripped = line.strip()
                    if stripped.startswith("StackName:"):
                        value = stripped.split(":", 1)[1].strip().strip("\"'")
                        if value:
                            return value

                # Use Description as a hint (first token, sanitised)
                for line in content.splitlines():
                    stripped = line.strip()
                    if stripped.startswith("Description:"):
                        desc = stripped.split(":", 1)[1].strip().strip("\"'")
                        if desc:
                            token = desc.split()[0]
                            return self._sanitise_stack_name(token)
            except OSError:
                pass  # fall through to directory-name fallback

        return self._sanitise_stack_name(self.project_dir.name)

    @staticmethod
    def _sanitise_stack_name(name):
        """Return a CloudFormation-safe stack name (alphanumeric + hyphens)."""
        sanitised = "".join(c if c.isalnum() or c == "-" else "-" for c in name)
        return sanitised.strip("-") or "app"

    def _get_s3_build_dir(self):
        """Return the first existing build output directory for S3 deployments."""
        for candidate in ("dist", "build", "public"):
            path = self.project_dir / candidate
            if path.exists():
                return path
        raise AWSDeployError(
            f"No build output directory found (dist/, build/, public/) in {self.project_dir}"
        )

    def build_deploy_command(self):
        """Build and return the AWS CLI command list for the selected target.

        If dry_run is True the command is printed to stdout and None is returned.
        """
        if self.target == "lambda":
            cmd = self._build_lambda_command()
        elif self.target == "ecs":
            cmd = self._build_ecs_command()
        else:  # s3
            cmd = self._build_s3_command()

        if self.dry_run:
            print("[DRY RUN] Would execute: " + " ".join(cmd))
            return None

        return cmd

    def _build_lambda_command(self):
        """Build CloudFormation deploy command for Lambda target."""
        template_file = (
            "template.yaml"
            if (self.project_dir / "template.yaml").exists()
            else "template.json"
        )
        stack_name = self.get_stack_name()

        cmd = [
            "aws", "cloudformation", "deploy",
            "--template-file", str(self.project_dir / template_file),
            "--stack-name", stack_name,
            "--capabilities", "CAPABILITY_IAM",
        ]

        if self.env:
            cmd += ["--parameter-overrides", f"Environment={self.env}"]

        if self.region:
            cmd += ["--region", self.region]

        return cmd

    def _build_ecs_command(self):
        """Build ECS update-service command for ECS target."""
        stack_name = self.get_stack_name()
        cluster = f"{stack_name}-cluster"
        service = f"{stack_name}-service"

        cmd = [
            "aws", "ecs", "update-service",
            "--cluster", cluster,
            "--service", service,
            "--force-new-deployment",
        ]

        if self.region:
            cmd += ["--region", self.region]

        return cmd

    def _build_s3_command(self):
        """Build S3 sync command for static site deployment."""
        build_dir = self._get_s3_build_dir()
        stack_name = self.get_stack_name()
        bucket = f"s3://{stack_name}"

        cmd = [
            "aws", "s3", "sync",
            str(build_dir) + "/",
            bucket,
            "--delete",
        ]

        if self.region:
            cmd += ["--region", self.region]

        return cmd

    def run_command(self, cmd, check=True):
        """Run a shell command and return the CompletedProcess result.

        Args:
            cmd: List of command arguments.
            check: If True, raise AWSDeployError on non-zero exit code.

        Returns:
            subprocess.CompletedProcess instance.

        Raises:
            AWSDeployError: When check=True and the command fails.
        """
        if self.verbose:
            print(f"Running: {' '.join(cmd)}")

        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        stdout = result.stdout.decode().strip()
        stderr = result.stderr.decode().strip()

        if self.verbose and stdout:
            print(stdout)
        if self.verbose and stderr:
            print(stderr, file=sys.stderr)

        if check and result.returncode != 0:
            error_msg = stderr or stdout or f"Command exited with code {result.returncode}"
            raise AWSDeployError(f"Command failed: {error_msg}")

        return result

    def deploy(self):
        """Orchestrate the full deployment pipeline.

        Steps:
        1. Validate project structure
        2. Verify AWS CLI is installed
        3. Build command
        4. Execute (or print if dry_run)

        Raises:
            AWSDeployError: On any validation or execution failure.
        """
        print(f"Deploying '{self.project_dir.name}' to AWS {self.target.upper()}...")

        self.validate_project()
        self.check_aws_cli_installed()

        cmd = self.build_deploy_command()

        if self.dry_run:
            print("Dry run complete. No changes were made.")
            return

        self.run_command(cmd)
        print(f"Deployment to {self.target.upper()} completed successfully.")


# ---------------------------------------------------------------------------
# CLI entry-point
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(
        description="Deploy to AWS",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--project", default=".", help="Project directory")
    parser.add_argument(
        "--target",
        choices=["lambda", "ecs", "s3"],
        default="lambda",
        help="Deploy target",
    )
    parser.add_argument("--env", help="Environment (production, staging, dev)")
    parser.add_argument("--region", help="AWS region override")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print commands without executing",
    )
    parser.add_argument("--verbose", action="store_true", help="Verbose output")

    args = parser.parse_args()

    deployer = AWSDeployer(
        project_dir=args.project,
        target=args.target,
        env=args.env,
        region=args.region,
        dry_run=args.dry_run,
        verbose=args.verbose,
    )
    try:
        deployer.deploy()
    except AWSDeployError as e:
        print(f"Deployment failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
