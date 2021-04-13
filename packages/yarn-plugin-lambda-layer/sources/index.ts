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

  package = Option.String(`--package`, `sample-lambda`, {
    description: `Name of the package to build a layer for`,
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

    // Find all deep workspace dependencies of the named package
    let dependencies = {};
    const requiredWorkspaces = new Set([
      project.getWorkspaceByIdent(structUtils.parseIdent(this.package)),
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
        .filter(
          ({ name, scope }) =>
            !(name === "aws-sdk" || scope?.startsWith("aws-sdk"))
        )
        .forEach(({ name, range }) => {
          if (
            dependencies[name] !== undefined &&
            dependencies[name] !== range
          ) {
            throw Error(
              `Found mismatched dependency versions for package ${name}`
            );
          }
          dependencies = { ...dependencies, [name]: range };
        });
    });

    // Construct a package.json file to write out to a new directory, along with other necessary files to install packages
    const layerDirectory = path.join(this.context.cwd, this.outputDir);
    const layerPackageJsonPath = path.join(layerDirectory, "package.json");
    const layerPackageJson = {
      name: "lambda-dependencies",
      description: "Lambda layer for dependencies",
      dependencies,
    };
    shelljs.rm("-rf", this.outputDir);
    shelljs.mkdir(this.outputDir);
    shelljs.echo(JSON.stringify(layerPackageJson)).to(layerPackageJsonPath);
    shelljs.echo(`yarnPath: ${configuration.get('yarnPath')}`).to(path.join(layerDirectory, '.yarnrc.yml'))
    shelljs.cp('-f', path.join(project.cwd, configuration.get('lockfileFilename')), path.join(layerDirectory, 'yarn.lock'))

    // Install the deps to create the full lambda layer
    const layerConfiguration = await Configuration.find(
      layerDirectory as PortablePath,
      this.context.plugins
    );
    const { project: layerProject } = await Project.find(
      layerConfiguration,
      layerDirectory as PortablePath,
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