const esbuild = require("esbuild");
const path = require("path");
const { pnpPlugin } = require("@yarnpkg/esbuild-plugin-pnp");

async function main() {
  const res = await esbuild.build({
    // banner: `require('/opt/nodejs/.pnp.cjs').setup();`,
    entryPoints: [path.join(__dirname, `src/handler.js`)],
    bundle: true,
    outfile: path.join(__dirname, 'build/handler.js'),
    logLevel: `silent`,
    plugins: [pnpPlugin()],
    minify: true,
    sourcemap: false,
    target: `node14`,
    format: 'cjs',
  });
}

main();
