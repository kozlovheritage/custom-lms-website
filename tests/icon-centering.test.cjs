// Run with Node 22+ and Chromium available on PATH (or CHROME_BIN).
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawn } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const selectors = [
  ".lms-problem-icon", ".lms-core-card-icon", ".lms-cost-detail-mark",
  ".lms-orbit-chip > span", ".lms-addon-arrow", ".ac-arrow",
  ".current-theme__sun", ".current-theme__moon",
  ".lms-ink-link span", ".lms-case-link span", ".lms-bottom-link span",
].join(",");
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

test("vector drawings stay centered inside their containers", { timeout: 90000 }, async t => {
  assert.equal(typeof WebSocket, "function", "This browser check requires Node 22+");
  const server = http.createServer((req, res) => {
    const relative = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const file = path.resolve(root, "." + (relative === "/" ? "/index.html" : relative));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.stat(file, (error, stat) => {
      if (error || !stat.isFile()) { res.writeHead(404).end(); return; }
      const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
        ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp" };
      res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
      fs.createReadStream(file).pipe(res);
    });
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "lms-icon-centering-"));
  const chrome = spawn(process.env.CHROME_BIN || "chromium", [
    "--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu",
    "--remote-debugging-port=0", "--user-data-dir=" + profile, "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });
  t.after(async () => {
    if (chrome.exitCode === null) {
      await new Promise(resolve => { chrome.once("exit", resolve); chrome.kill("SIGKILL"); });
    }
    fs.rmSync(profile, { recursive: true, force: true });
  });
  const endpoint = await new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => reject(new Error("Chromium did not start")), 10000);
    chrome.once("error", error => { clearTimeout(timeout); reject(error); });
    chrome.stderr.on("data", chunk => {
      output += chunk.toString();
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timeout); resolve(new URL(match[1])); }
    });
  });
  const pages = await (await fetch(`http://${endpoint.host}/json/list`)).json();
  const socket = new WebSocket(pages.find(page => page.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  t.after(() => socket.close());
  let sequence = 0;
  const requests = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    const request = requests.get(message.id);
    if (request) {
      requests.delete(message.id);
      message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result);
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    requests.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    assert.ok(!result.exceptionDetails, result.exceptionDetails?.text);
    return result.result.value;
  };
  await send("Page.enable");
  await send("DOM.enable");
  const failures = [];
  let measured = 0;
  for (const lang of ["ru", "en"]) {
    await send("Page.navigate", {
      url: `http://127.0.0.1:${server.address().port}/${lang === "ru" ? "index.html" : "index.en.html"}`,
    });
    await wait(600);
    await evaluate("document.fonts.ready.then(() => true)");
    for (const width of [320, 375, 390, 430, 768, 1024]) {
      await send("Emulation.setDeviceMetricsOverride", {
        width, height: 900, deviceScaleFactor: 2, mobile: true,
      });
      await wait(180);
      for (const theme of ["light", "dark"]) {
        await evaluate(`document.documentElement.dataset.theme = "${theme}"`);
        const { root: document } = await send("DOM.getDocument", { depth: -1 });
        const { nodeIds } = await send("DOM.querySelectorAll", { nodeId: document.nodeId, selector: selectors });
        for (const nodeId of nodeIds) {
          const { node } = await send("DOM.describeNode", { nodeId });
          let host;
          try {
            host = (await send("DOM.getBoxModel", { nodeId })).model;
          } catch (error) {
            if (error.message.includes("Could not compute box model")) continue; // Inactive theme symbol.
            throw error;
          }
          const center = quad => [(quad[0] + quad[4]) / 2, (quad[1] + quad[5]) / 2];
          const outer = center(host.border);
          for (const pseudo of node.pseudoElements || []) {
            if (!["before", "after"].includes(pseudo.pseudoType)) continue;
            const model = (await send("DOM.getBoxModel", { backendNodeId: pseudo.backendNodeId })).model;
            const inner = center(model.border);
            const dx = inner[0] - outer[0], dy = inner[1] - outer[1];
            measured++;
            if (Math.abs(dx) > 0.6 || Math.abs(dy) > 0.6) {
              const attributes = node.attributes || [];
              const className = attributes[attributes.indexOf("class") + 1];
              failures.push({ lang, width, theme, className, pseudo: pseudo.pseudoType, dx, dy });
            }
          }
        }
      }
    }
  }
  assert.ok(measured > 400, `Only ${measured} vector boxes checked`);
  assert.equal(failures.length, 0, JSON.stringify(failures.slice(0, 12), null, 2));
  t.diagnostic(`${measured} vector boxes centered across 24 language/theme/width combinations`);
});
