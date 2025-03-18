require("dotenv").config();
const axios = require("axios");
const AdmZip = require("adm-zip");

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const REDIRECT_URL = process.env.REDIRECT_URL;

const authentication = async (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URL}&scope=repo,workflow`;
  res.redirect(githubAuthUrl);
};

const authenticationCallback = async (req, res) => {
  const code = req.query.code;
  if (!code)
    return res.status(400).json({ error: "Authorization code missing" });

  try {
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URL,
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken)
      return res.status(400).json({ error: "Failed to get access token" });

    req.session.accessToken = accessToken;
    // console.log(req.session.accessToken);

    res.json({ access_token: accessToken });
  } catch (error) {
    console.error("OAuth error:", error);
    res.status(500).json({ error: "OAuth failed" });
  }
};

const repositories = async (req, res) => {
  const accessToken = req.session.accessToken;
  // console.log(accessToken);
  if (!accessToken) return res.status(401).json({ error: "Unauthorized" });

  try {
    const response = await axios.get("https://api.github.com/user/repos", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    res.json(response.data); // Returns list of repositories with owner details
  } catch (error) {
    console.error("GitHub API error:", error);
    res.status(500).json({ error: "Failed to fetch repositories" });
  }
};

const repoCommits = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    if (!owner || !repo) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const accessToken = req.session.accessToken;
    if (!accessToken) {
      return res.status(401).json({ error: "Unauthorized User" });
    }

    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/commits`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(
      "GitHub Commit request error:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to fetch commits" });
  }
};

const extractId = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const accessToken = req.session.accessToken;
    if (!accessToken)
      return res.status(401).json({ error: "Unauthorized user" });
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    res.send(response.data);
  } catch (error) {
    console.log("Action error:", error);
    res.status(500).json({ error: "Failed to fetch the Github Actions" });
  }
};

const getLogs = async (req, res) => {
  try {
    const { owner, repo, run_id } = req.params;
    const accessToken = req.session.accessToken;
    if (!accessToken)
      return res.status(401).json({ error: "Unauthorized user" });

    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs/${run_id}/logs`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        responseType: "arraybuffer", // 👈 Important: Fetch as binary data
      }
    );

    const zip = new AdmZip(response.data); // Extract the ZIP
    const zipEntries = zip.getEntries();

    let logs = {};
    zipEntries.forEach((entry) => {
      logs[entry.entryName] = zip.readAsText(entry); // Read log files as text
    });

    res.json({ logs });
  } catch (error) {
    console.log("Logs Error:", error);
    res.status(500).json({ error: "Failed to fetch Logs" });
  }
};

module.exports = {
  authentication,
  authenticationCallback,
  repositories,
  repoCommits,
  getLogs,
  extractId,
};
