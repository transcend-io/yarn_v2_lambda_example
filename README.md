# Yarn v2 Lambda Example

To create the lambda layer:

```bash
yarn workspace yarn-plugin-lambda-layer register
yarn lambda layer
```

To bundle lambda code via webpack:

```bash
yarn workspace sample-lambda run webpack --config webpack.js
```

To deploy the lambda via serverless:

```bash
yarn workspace sample-lambda run serverless deploy
```

To check on logs after invoking the function via `curl <endpoint>`:

```bash
yarn workspace sample-lambda run serverless logs -f basicHttpHandler
```

## Esbuild example

To build the esbuild example, run:

```bash
yarn workspace sample-lambda-esbuild node build.js
```

And to deploy run:

```bash
yarn workspace sample-lambda-esbuild run serverless deploy
```
