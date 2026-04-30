const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

// 🔥 IMPORTANT
const TOKEN = process.env.GITHUB_TOKEN;
const OWNER = "arbindsapu12";  // <-- अपना GitHub username डालो
const REPO = "apk-backend1";

// ✅ TEST
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// ✅ Build
app.post("/build", async (req, res) => {
  const url = req.body.url;

  await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/build.yml/dispatches`, {
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

// ✅ Status
app.get("/status", async (req, res) => {
  const runs = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/actions/runs`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  }).then(r => r.json());

  const latest = runs.workflow_runs[0];

  if (latest && latest.status === "completed") {

    const artifacts = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/actions/artifacts`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    }).then(r => r.json());

    const apk = artifacts.artifacts.find(a => a.name.includes("apk"));
    const aab = artifacts.artifacts.find(a => a.name.includes("aab"));

    return res.json({
      done: true,
      apk: apk?.archive_download_url,
      aab: aab?.archive_download_url
    });
  }

  res.json({ done: false });
});

// 🔥 PORT FIX (सबसे जरूरी)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
