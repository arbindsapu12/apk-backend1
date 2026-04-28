const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

// 🔥 CHANGE THESE
const TOKEN = "PASTE_YOUR_GITHUB_TOKEN";
const OWNER = "YOUR_USERNAME";
const REPO = "YOUR_APK_BUILDER_REPO";
const WORKFLOW = "build.yml";

// ✅ STEP 1: Trigger build
app.post("/build", async (req, res) => {
  const url = req.body.url;

  await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json"
    },
    body: JSON.stringify({
      ref: "main",
      inputs: {
        website_url: url,
        package_name: "com.webtoapk." + Date.now()
      }
    })
  });

  res.json({ message: "Build started" });
});

// ✅ STEP 2: Check status + get APK/AAB
app.get("/status", async (req, res) => {
  const runs = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/actions/runs`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  }).then(r => r.json());

  const latest = runs.workflow_runs[0];

  if (latest.status === "completed") {

    const artifacts = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/actions/artifacts`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    }).then(r => r.json());

    const apk = artifacts.artifacts.find(a => a.name.includes("apk"));
    const aab = artifacts.artifacts.find(a => a.name.includes("aab"));

    return res.json({
      done: true,
      apk: apk.archive_download_url,
      aab: aab.archive_download_url
    });
  }

  res.json({ done: false });
});

app.listen(3000, () => console.log("Server running"));
