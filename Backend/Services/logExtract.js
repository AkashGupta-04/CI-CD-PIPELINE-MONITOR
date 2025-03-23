function processLogs(logText) {
  const structuredLogs = {};
  let currentGroup = null;
  let stepLogs = [];
  let hasGroups = false; // Track if at least one ##[group] is found
  let hasContent = false; // Track if file has any logs

  logText.split("\n").forEach((line) => {
    // Remove timestamps (Format: YYYY-MM-DDTHH:MM:SS.sssZ)
    line = line
      .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6,7}Z\s/, "")
      .trim();

    // Ignore "Fetching repository" logs
    if (line.includes("Fetching repository")) return;

    if (line.startsWith("##[group]")) {
      // Save previous group, even if it had only one line
      if (currentGroup !== null) {
        structuredLogs[currentGroup] = stepLogs.length
          ? stepLogs
          : ["(No additional logs)"];
      }
      currentGroup = line.replace("##[group]", "").trim();
      stepLogs = []; // Reset logs for new step
      hasGroups = true;
    } else if (line.startsWith("##[endgroup]")) {
      if (currentGroup !== null) {
        structuredLogs[currentGroup] = stepLogs.length
          ? stepLogs
          : ["(No additional logs)"];
      }
      currentGroup = null;
      stepLogs = [];
    } else {
      hasContent = true; // Mark that at least one log exists
      if (currentGroup) {
        stepLogs.push(line); // Append log content
      } else {
        // Store logs without group markers
        if (!structuredLogs["Uncategorized Logs"]) {
          structuredLogs["Uncategorized Logs"] = [];
        }
        structuredLogs["Uncategorized Logs"].push(line);
      }
    }
  });

  // Ensure the last group is stored
  if (currentGroup !== null) {
    structuredLogs[currentGroup] = stepLogs.length
      ? stepLogs
      : ["(No additional logs)"];
  }

  // If no `##[group]` was found and content exists, place it under "Uncategorized Logs"
  if (!hasGroups && hasContent) {
    structuredLogs["Uncategorized Logs"] = stepLogs.length
      ? stepLogs
      : ["(No additional logs)"];
  }

  // If file is completely empty, add a placeholder
  if (!hasContent) {
    structuredLogs["(No logs found)"] = [];
  }

  // Sort grouped logs alphabetically
  return Object.keys(structuredLogs)
    .sort()
    .reduce((acc, key) => {
      acc[key] = structuredLogs[key];
      return acc;
    }, {});
}

module.exports = { processLogs };
