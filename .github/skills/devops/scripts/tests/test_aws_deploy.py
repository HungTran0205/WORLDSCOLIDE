"""
Tests for aws_deploy.py

Run with: pytest test_aws_deploy.py -v
"""

import subprocess
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from aws_deploy import AWSDeployError, AWSDeployer


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def temp_project(tmp_path):
    """Temporary project directory pre-populated for all three targets."""
    # Lambda: CloudFormation template
    template = tmp_path / "template.yaml"
    template.write_text(
        "AWSTemplateFormatVersion: '2010-09-09'\nDescription: MyApp Lambda stack\n"
    )
    # ECS: Dockerfile
    (tmp_path / "Dockerfile").write_text("FROM python:3.12-slim\n")
    # S3: dist/ directory
    dist = tmp_path / "dist"
    dist.mkdir()
    (dist / "index.html").write_text("<html></html>")
    return tmp_path


@pytest.fixture
def deployer(temp_project):
    """Default AWSDeployer pointed at temp_project (lambda target)."""
    return AWSDeployer(project_dir=temp_project, target="lambda")


# ---------------------------------------------------------------------------
# 1. Initialization
# ---------------------------------------------------------------------------


class TestAWSDeployerInit:
    """Test AWSDeployer initialisation."""

    def test_defaults(self, temp_project):
        d = AWSDeployer(project_dir=temp_project)
        assert d.target == "lambda"
        assert d.env is None
        assert d.region is None
        assert d.dry_run is False
        assert d.verbose is False

    def test_custom_target_ecs(self, temp_project):
        d = AWSDeployer(project_dir=temp_project, target="ecs")
        assert d.target == "ecs"

    def test_custom_target_s3(self, temp_project):
        d = AWSDeployer(project_dir=temp_project, target="s3")
        assert d.target == "s3"

    def test_custom_env(self, temp_project):
        d = AWSDeployer(project_dir=temp_project, env="staging")
        assert d.env == "staging"

    def test_custom_region(self, temp_project):
        d = AWSDeployer(project_dir=temp_project, region="eu-west-1")
        assert d.region == "eu-west-1"

    def test_dry_run_flag(self, temp_project):
        d = AWSDeployer(project_dir=temp_project, dry_run=True)
        assert d.dry_run is True

    def test_verbose_flag(self, temp_project):
        d = AWSDeployer(project_dir=temp_project, verbose=True)
        assert d.verbose is True

    def test_invalid_target_raises(self, temp_project):
        with pytest.raises(AWSDeployError, match="Invalid target"):
            AWSDeployer(project_dir=temp_project, target="gcp")

    def test_project_dir_resolved(self, temp_project):
        d = AWSDeployer(project_dir=str(temp_project))
        assert d.project_dir == temp_project.resolve()


# ---------------------------------------------------------------------------
# 2. Project validation
# ---------------------------------------------------------------------------


class TestValidateProject:
    """Test validate_project()."""

    def test_valid_lambda_template_yaml(self, temp_project):
        d = AWSDeployer(project_dir=temp_project, target="lambda")
        d.validate_project()  # no exception

    def test_valid_lambda_template_json(self, tmp_path):
        (tmp_path / "template.json").write_text("{}")
        d = AWSDeployer(project_dir=tmp_path, target="lambda")
        d.validate_project()

    def test_lambda_missing_template_raises(self, tmp_path):
        d = AWSDeployer(project_dir=tmp_path, target="lambda")
        with pytest.raises(AWSDeployError, match="CloudFormation template"):
            d.validate_project()

    def test_nonexistent_dir_raises(self, tmp_path):
        missing = tmp_path / "does_not_exist"
        d = AWSDeployer(project_dir=missing, target="lambda")
        with pytest.raises(AWSDeployError, match="does not exist"):
            d.validate_project()

    def test_valid_ecs_dockerfile(self, temp_project):
        d = AWSDeployer(project_dir=temp_project, target="ecs")
        d.validate_project()

    def test_valid_ecs_compose(self, tmp_path):
        (tmp_path / "docker-compose.yml").write_text("version: '3'\n")
        d = AWSDeployer(project_dir=tmp_path, target="ecs")
        d.validate_project()

    def test_ecs_missing_dockerfile_raises(self, tmp_path):
        d = AWSDeployer(project_dir=tmp_path, target="ecs")
        with pytest.raises(AWSDeployError, match="Dockerfile"):
            d.validate_project()

    def test_valid_s3_dist_dir(self, temp_project):
        d = AWSDeployer(project_dir=temp_project, target="s3")
        d.validate_project()

    def test_valid_s3_build_dir(self, tmp_path):
        (tmp_path / "build").mkdir()
        d = AWSDeployer(project_dir=tmp_path, target="s3")
        d.validate_project()

    def test_valid_s3_public_dir(self, tmp_path):
        (tmp_path / "public").mkdir()
        d = AWSDeployer(project_dir=tmp_path, target="s3")
        d.validate_project()

    def test_s3_missing_build_dir_raises(self, tmp_path):
        d = AWSDeployer(project_dir=tmp_path, target="s3")
        with pytest.raises(AWSDeployError, match="build output directory"):
            d.validate_project()


# ---------------------------------------------------------------------------
# 3. AWS CLI detection
# ---------------------------------------------------------------------------


class TestCheckAwsCliInstalled:
    """Test check_aws_cli_installed()."""

    @patch("subprocess.run")
    def test_cli_installed(self, mock_run, deployer):
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout=b"aws-cli/2.13.0 Python/3.11.4",
            stderr=b"",
        )
        deployer.check_aws_cli_installed()  # no exception

    @patch("subprocess.run")
    def test_cli_not_found_raises(self, mock_run, deployer):
        mock_run.side_effect = FileNotFoundError("aws not found")
        with pytest.raises(AWSDeployError, match="AWS CLI not found"):
            deployer.check_aws_cli_installed()

    @patch("subprocess.run")
    def test_cli_command_failure_raises(self, mock_run, deployer):
        mock_run.side_effect = subprocess.CalledProcessError(
            1, "aws", stderr=b"error output"
        )
        with pytest.raises(AWSDeployError):
            deployer.check_aws_cli_installed()

    @patch("subprocess.run")
    def test_cli_verbose_prints_version(self, mock_run, temp_project, capsys):
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout=b"aws-cli/2.0",
            stderr=b"",
        )
        d = AWSDeployer(project_dir=temp_project, verbose=True)
        d.check_aws_cli_installed()
        captured = capsys.readouterr()
        assert "aws-cli" in captured.out


# ---------------------------------------------------------------------------
# 4. Stack name extraction
# ---------------------------------------------------------------------------


class TestGetStackName:
    """Test get_stack_name()."""

    def test_stack_name_from_description(self, temp_project):
        # template.yaml already has Description: MyApp Lambda stack
        d = AWSDeployer(project_dir=temp_project, target="lambda")
        name = d.get_stack_name()
        assert name == "MyApp"

    def test_stack_name_from_explicit_param(self, tmp_path):
        template = tmp_path / "template.yaml"
        template.write_text(
            "AWSTemplateFormatVersion: '2010-09-09'\nStackName: my-explicit-stack\n"
        )
        d = AWSDeployer(project_dir=tmp_path, target="lambda")
        assert d.get_stack_name() == "my-explicit-stack"

    def test_stack_name_fallback_to_dir_name(self, tmp_path):
        # No template present
        d = AWSDeployer(project_dir=tmp_path, target="s3")
        name = d.get_stack_name()
        assert isinstance(name, str)
        assert len(name) > 0

    def test_sanitise_special_chars(self):
        result = AWSDeployer._sanitise_stack_name("my_app.project!")
        assert all(c.isalnum() or c == "-" for c in result)

    def test_sanitise_leading_trailing_hyphens(self):
        result = AWSDeployer._sanitise_stack_name("-leading-trailing-")
        assert not result.startswith("-")
        assert not result.endswith("-")


# ---------------------------------------------------------------------------
# 5. Command building
# ---------------------------------------------------------------------------


class TestBuildDeployCommand:
    """Test build_deploy_command() for all targets."""

    def test_lambda_basic(self, temp_project):
        d = AWSDeployer(project_dir=temp_project, target="lambda")
        cmd = d.build_deploy_command()
        assert cmd is not None
        assert "cloudformation" in cmd
        assert "deploy" in cmd
        assert "--capabilities" in cmd
        assert "CAPABILITY_IAM" in cmd

    def test_lambda_with_env(self, temp_project):
        d = AWSDeployer(project_dir=temp_project, target="lambda", env="production")
        cmd = d.build_deploy_command()
        assert "--parameter-overrides" in cmd
        assert any("Environment=production" in arg for arg in cmd)

    def test_lambda_with_region(self, temp_project):
        d = AWSDeployer(project_dir=temp_project, target="lambda", region="ap-southeast-1")
        cmd = d.build_deploy_command()
        assert "--region" in cmd
        assert "ap-southeast-1" in cmd

    def test_ecs_basic(self, temp_project):
        d = AWSDeployer(project_dir=temp_project, target="ecs")
        cmd = d.build_deploy_command()
        assert "ecs" in cmd
        assert "update-service" in cmd
        assert "--force-new-deployment" in cmd

    def test_ecs_with_env_does_not_break(self, temp_project):
        d = AWSDeployer(project_dir=temp_project, target="ecs", env="staging")
        cmd = d.build_deploy_command()
        assert cmd is not None

    def test_s3_basic(self, temp_project):
        d = AWSDeployer(project_dir=temp_project, target="s3")
        cmd = d.build_deploy_command()
        assert "s3" in cmd
        assert "sync" in cmd
        assert "--delete" in cmd

    def test_s3_with_region(self, temp_project):
        d = AWSDeployer(project_dir=temp_project, target="s3", region="us-west-2")
        cmd = d.build_deploy_command()
        assert "--region" in cmd
        assert "us-west-2" in cmd

    def test_dry_run_returns_none(self, temp_project, capsys):
        d = AWSDeployer(project_dir=temp_project, target="lambda", dry_run=True)
        result = d.build_deploy_command()
        assert result is None
        captured = capsys.readouterr()
        assert "[DRY RUN]" in captured.out

    def test_dry_run_ecs_returns_none(self, temp_project, capsys):
        d = AWSDeployer(project_dir=temp_project, target="ecs", dry_run=True)
        result = d.build_deploy_command()
        assert result is None

    def test_dry_run_s3_returns_none(self, temp_project, capsys):
        d = AWSDeployer(project_dir=temp_project, target="s3", dry_run=True)
        result = d.build_deploy_command()
        assert result is None


# ---------------------------------------------------------------------------
# 6. Command execution
# ---------------------------------------------------------------------------


class TestRunCommand:
    """Test run_command()."""

    @patch("subprocess.run")
    def test_success(self, mock_run, deployer):
        mock_run.return_value = MagicMock(returncode=0, stdout=b"ok", stderr=b"")
        result = deployer.run_command(["aws", "s3", "ls"])
        assert result.returncode == 0

    @patch("subprocess.run")
    def test_failure_with_check_raises(self, mock_run, deployer):
        mock_run.return_value = MagicMock(
            returncode=1, stdout=b"", stderr=b"Access denied"
        )
        with pytest.raises(AWSDeployError, match="Access denied"):
            deployer.run_command(["aws", "bad", "cmd"], check=True)

    @patch("subprocess.run")
    def test_failure_no_check_no_raise(self, mock_run, deployer):
        mock_run.return_value = MagicMock(returncode=1, stdout=b"", stderr=b"err")
        result = deployer.run_command(["aws", "bad", "cmd"], check=False)
        assert result.returncode == 1

    @patch("subprocess.run")
    def test_verbose_prints_stdout(self, mock_run, temp_project, capsys):
        mock_run.return_value = MagicMock(returncode=0, stdout=b"output line", stderr=b"")
        d = AWSDeployer(project_dir=temp_project, verbose=True)
        d.run_command(["aws", "s3", "ls"])
        captured = capsys.readouterr()
        assert "output line" in captured.out


# ---------------------------------------------------------------------------
# 7. Full deployment
# ---------------------------------------------------------------------------


class TestDeploy:
    """Test the deploy() orchestration method."""

    @patch("subprocess.run")
    def test_lambda_success_flow(self, mock_run, temp_project):
        mock_run.return_value = MagicMock(returncode=0, stdout=b"done", stderr=b"")
        d = AWSDeployer(project_dir=temp_project, target="lambda")
        d.deploy()  # no exception

    @patch("subprocess.run")
    def test_ecs_success_flow(self, mock_run, temp_project):
        mock_run.return_value = MagicMock(returncode=0, stdout=b"done", stderr=b"")
        d = AWSDeployer(project_dir=temp_project, target="ecs")
        d.deploy()

    @patch("subprocess.run")
    def test_s3_success_flow(self, mock_run, temp_project):
        mock_run.return_value = MagicMock(returncode=0, stdout=b"done", stderr=b"")
        d = AWSDeployer(project_dir=temp_project, target="s3")
        d.deploy()

    @patch("subprocess.run")
    def test_dry_run_flow_no_subprocess_deploy(self, mock_run, temp_project, capsys):
        # subprocess.run is called once for `aws --version`, NOT for the deploy cmd
        mock_run.return_value = MagicMock(returncode=0, stdout=b"aws-cli/2", stderr=b"")
        d = AWSDeployer(project_dir=temp_project, target="lambda", dry_run=True)
        d.deploy()
        assert mock_run.call_count == 1  # only the version check

    @patch("subprocess.run")
    def test_missing_cli_raises(self, mock_run, temp_project):
        mock_run.side_effect = FileNotFoundError("aws not found")
        d = AWSDeployer(project_dir=temp_project, target="lambda")
        with pytest.raises(AWSDeployError, match="AWS CLI not found"):
            d.deploy()

    @patch("subprocess.run")
    def test_command_failure_raises(self, mock_run, temp_project):
        mock_run.side_effect = [
            MagicMock(returncode=0, stdout=b"aws-cli/2", stderr=b""),  # version check
            MagicMock(returncode=1, stdout=b"", stderr=b"Stack update failed"),  # deploy
        ]
        d = AWSDeployer(project_dir=temp_project, target="lambda")
        with pytest.raises(AWSDeployError, match="Stack update failed"):
            d.deploy()

    def test_invalid_project_raises_before_cli_check(self, tmp_path):
        d = AWSDeployer(project_dir=tmp_path, target="lambda")
        with pytest.raises(AWSDeployError, match="CloudFormation template"):
            d.deploy()


# ---------------------------------------------------------------------------
# 8. Integration
# ---------------------------------------------------------------------------


class TestIntegration:
    """End-to-end deployment workflow tests with mocked subprocess."""

    @patch("subprocess.run")
    def test_full_lambda_workflow(self, mock_run, temp_project):
        """Lambda: validate → CLI check → deploy → success."""
        mock_run.return_value = MagicMock(returncode=0, stdout=b"ok", stderr=b"")
        d = AWSDeployer(
            project_dir=temp_project,
            target="lambda",
            env="production",
            region="us-east-1",
        )
        d.deploy()
        assert mock_run.call_count == 2  # version + deploy
        deploy_call_args = mock_run.call_args_list[1][0][0]
        assert "cloudformation" in deploy_call_args
        assert "Environment=production" in " ".join(deploy_call_args)
        assert "us-east-1" in deploy_call_args

    @patch("subprocess.run")
    def test_full_s3_workflow(self, mock_run, temp_project):
        """S3: validate → CLI check → sync → success."""
        mock_run.return_value = MagicMock(returncode=0, stdout=b"ok", stderr=b"")
        d = AWSDeployer(project_dir=temp_project, target="s3", region="eu-central-1")
        d.deploy()
        assert mock_run.call_count == 2
        sync_call_args = mock_run.call_args_list[1][0][0]
        assert "sync" in sync_call_args
        assert "eu-central-1" in sync_call_args

    @patch("subprocess.run")
    def test_full_ecs_workflow(self, mock_run, temp_project):
        """ECS: validate → CLI check → update-service → success."""
        mock_run.return_value = MagicMock(returncode=0, stdout=b"ok", stderr=b"")
        d = AWSDeployer(project_dir=temp_project, target="ecs")
        d.deploy()
        assert mock_run.call_count == 2
        ecs_call_args = mock_run.call_args_list[1][0][0]
        assert "update-service" in ecs_call_args

    @patch("subprocess.run")
    def test_dry_run_prints_command_no_deploy(self, mock_run, temp_project, capsys):
        mock_run.return_value = MagicMock(returncode=0, stdout=b"aws-cli/2", stderr=b"")
        d = AWSDeployer(project_dir=temp_project, target="s3", dry_run=True)
        d.deploy()
        captured = capsys.readouterr()
        assert "[DRY RUN]" in captured.out
        assert mock_run.call_count == 1  # no actual deploy

    @patch("subprocess.run")
    def test_verbose_integration(self, mock_run, temp_project, capsys):
        mock_run.return_value = MagicMock(returncode=0, stdout=b"deploy output", stderr=b"")
        d = AWSDeployer(project_dir=temp_project, target="lambda", verbose=True)
        d.deploy()
        captured = capsys.readouterr()
        assert "deploy output" in captured.out
