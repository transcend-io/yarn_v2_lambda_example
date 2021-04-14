import { BaseCommand } from "@yarnpkg/cli";
import { Option } from "clipanion";
import {
  Cache,
  Configuration,
  Plugin,
  Manifest,
  Project,
  StreamReport,
  Workspace,
  structUtils,
} from "@yarnpkg/core";
import shelljs from "shelljs";
import path from "path";
import { PortablePath } from "@yarnpkg/fslib";

class LambdaLayerCommand extends BaseCommand {
  static paths = [[`lambda`, `layer`]];

  workspace = Option.String(`--workspace`, `sample-lambda`, {
    description: `Name of the workspace to build a layer for`,
  });

  outputDir = Option.String(`--output`, `serverless-build`, {
    description: `Folder to treat as the root of the Lambda Layer`,
  });

  async execute() {
    // Lookup the current yarn workspace and restore its installation state
    const configuration = await Configuration.find(
      this.context.cwd,
      this.context.plugins
    );
    const { project, workspace } = await Project.find(
      configuration,
      this.context.cwd
    );
    const cache = await Cache.find(configuration);
    await project.restoreInstallState({
      restoreResolutions: false,
    });

    // Find all deep workspace dependencies of the named workspace
    let dependencies = {};
    const requiredWorkspaces = new Set([
      project.getWorkspaceByIdent(structUtils.parseIdent(this.workspace)),
    ]);
    requiredWorkspaces.forEach((workspace) => {
      // For all workspace deps, add them to be searched later
      [...workspace.manifest.dependencies.values()]
        .map((descriptor) => project.tryWorkspaceByDescriptor(descriptor))
        .filter((child): child is Workspace => child !== null)
        .forEach((workspace) => requiredWorkspaces.add(workspace));

      // For all third-party deps, add them to our dependencies list
      [...workspace.manifest.dependencies.values()]
        .filter(
          (descriptor) => project.tryWorkspaceByDescriptor(descriptor) === null
        )
        // TODO: https://github.com/aws/aws-sdk-js-v3/issues/2149 - do not include scope?.startsWith("aws-sdk") once fixed
        // .filter(
        //   ({ name, scope }) =>
        //     !(name === "aws-sdk" || scope?.startsWith("aws-sdk"))
        // )
        .filter(({ name }) => name !== 'aws-sdk')
        .forEach((descriptor) => {
          const depName = structUtils.stringifyIdent(descriptor)
          if (
            dependencies[depName] !== undefined &&
            dependencies[depName] !== descriptor.range
          ) {
            throw Error(
              `Found mismatched dependency versions for package ${depName}`
            );
          }
          dependencies = { ...dependencies, [depName]: descriptor.range };
        });
    });

    // Construct a package.json file to write out to a new directory, along with other necessary files to install packages
    const layerDirectory = path.join(this.context.cwd, this.outputDir);
    const dependencyInstallDirectory = path.join(layerDirectory, "nodejs")
    const layerPackageJsonPath = path.join(dependencyInstallDirectory, "package.json");
    const layerPackageJson = {
      name: "lambda-dependencies",
      description: "Lambda layer for dependencies",
      type: "commonjs",
      dependencies,
    };
    shelljs.rm('-rf', layerDirectory);
    shelljs.mkdir("-p", dependencyInstallDirectory);
    shelljs.echo(JSON.stringify(layerPackageJson)).to(layerPackageJsonPath);
    shelljs.echo(`yarnPath: ${configuration.get('yarnPath')}`).to(path.join(dependencyInstallDirectory, '.yarnrc.yml'))
    shelljs.cp('-f', path.join(project.cwd, configuration.get('lockfileFilename')), path.join(dependencyInstallDirectory, 'yarn.lock'))

    // Install the deps to create the full lambda layer
    const layerConfiguration = await Configuration.find(
      dependencyInstallDirectory as PortablePath,
      this.context.plugins
    );
    const { project: layerProject } = await Project.find(
      layerConfiguration,
      dependencyInstallDirectory as PortablePath,
    );
    const layerCache = await Cache.find(layerConfiguration);
    const report = await StreamReport.start(
      {
        configuration: layerConfiguration,
        json: false,
        stdout: process.stdout,
        includeLogs: true,
      },
      async (report) => {
        await layerProject.install({
          cache: layerCache,
          report,
          persistProject: false,
        });
      }
    );
    if (report.exitCode() !== 0) {
      throw Error("Failed to install package dependencies");
    }
  }
}

const plugin: Plugin = {
  commands: [LambdaLayerCommand],
};

export default plugin;
