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
