import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(process.cwd(), "data");
const dataFile = path.join(dataDir, "app.json");

const defaultState = {
  users: [],
  nonces: [],
  sessions: [],
  playerSaves: [],
  playerSaveBackups: [],
  worlds: {},
};

function ensureStorage() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(defaultState, null, 2), "utf8");
  }
}

function readState() {
  ensureStorage();
  const raw = fs.readFileSync(dataFile, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      nonces: Array.isArray(parsed.nonces) ? parsed.nonces : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      playerSaves: Array.isArray(parsed.playerSaves) ? parsed.playerSaves : [],
      playerSaveBackups: Array.isArray(parsed.playerSaveBackups) ? parsed.playerSaveBackups : [],
      worlds: parsed.worlds && typeof parsed.worlds === "object" ? parsed.worlds : {},
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function writeState(state) {
  ensureStorage();
  fs.writeFileSync(dataFile, JSON.stringify(state, null, 2), "utf8");
}

export const store = {
  read() {
    return readState();
  },
  write(nextState) {
    writeState(nextState);
  },
  mutate(updater) {
    const state = readState();
    const result = updater(state) ?? state;
    writeState(result);
    return result;
  },
  filePath: dataFile,
};
