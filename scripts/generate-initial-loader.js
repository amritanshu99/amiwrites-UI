const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const babel = require("@babel/core");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const SCENE_PATH = path.join(
  PROJECT_ROOT,
  "src/components/Portfolio/InitialLoaderScene.jsx",
);
const CSS_PATH = path.join(
  PROJECT_ROOT,
  "src/components/Portfolio/InitialLoader.css",
);
const INDEX_PATH = path.join(PROJECT_ROOT, "public/index.html");

const replaceGeneratedBlock = (html, name, content) => {
  const start = `<!-- ${name}_START -->`;
  const end = `<!-- ${name}_END -->`;
  const startIndex = html.indexOf(start);
  const endIndex = html.indexOf(end, startIndex + start.length);

  if (startIndex < 0 || endIndex < 0) {
    throw new Error(`Missing generated loader block: ${name}`);
  }

  const indentation = html.slice(html.lastIndexOf("\n", startIndex) + 1, startIndex);
  return `${html.slice(0, startIndex + start.length)}\n${content}\n${indentation}${html.slice(endIndex)}`;
};

const renderInitialLoader = () => {
  // This compilation runs only in Node during build/start. The browser receives
  // static HTML from the same component React will display on its first commit.
  const { code } = babel.transformFileSync(SCENE_PATH, {
    babelrc: false,
    configFile: false,
    presets: [[require.resolve("@babel/preset-react"), { runtime: "classic" }]],
    plugins: [require.resolve("@babel/plugin-transform-modules-commonjs")],
  });
  const sceneModule = new Module(SCENE_PATH, module);
  sceneModule.filename = SCENE_PATH;
  sceneModule.paths = module.paths;
  sceneModule._compile(code, SCENE_PATH);

  return renderToStaticMarkup(
    React.createElement(sceneModule.exports.default, {
      id: "app-bootstrap-loader",
    }),
  );
};

const generateInitialLoader = (html) => {
  const css = fs.readFileSync(CSS_PATH, "utf8").trim();
  const withStyles = replaceGeneratedBlock(
    html,
    "INITIAL_LOADER_STYLES",
    `    <style id="initial-loader-critical-styles">\n${css}\n    </style>`,
  );

  return replaceGeneratedBlock(
    withStyles,
    "INITIAL_LOADER_MARKUP",
    `      ${renderInitialLoader()}`,
  );
};

if (require.main === module) {
  try {
    const previous = fs.readFileSync(INDEX_PATH, "utf8");
    const next = generateInitialLoader(previous);
    if (previous !== next) fs.writeFileSync(INDEX_PATH, next, "utf8");
    console.log("Initial loader first-paint HTML and CSS are synchronized.");
  } catch (error) {
    console.error(`Unable to generate the initial loader: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { generateInitialLoader, renderInitialLoader, replaceGeneratedBlock };
