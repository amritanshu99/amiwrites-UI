const key = "amibot-voice-context-v1";

export function readVoiceContext() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(key));
    if (!saved || Date.now() - saved.at > 5 * 60 * 1000 || !Array.isArray(saved.messages)) return null;
    const messages = saved.messages.filter((message) => ["user", "bot"].includes(message?.sender) && typeof message.text === "string").slice(-24);
    return messages.length ? messages : null;
  } catch { return null; }
}

export function clearVoiceContext() {
  try { sessionStorage.removeItem(key); } catch { /* Storage may be disabled. */ }
}

export function navigateVoicePage(path, messages, authenticated, navigate = (url) => window.location.assign(url)) {
  clearVoiceContext();
  // Signed-in conversations already live in AmiBot history. Guest context is
  // handed across this one navigation in this tab, then removed on arrival.
  if (!authenticated) {
    try { sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), messages: messages.slice(-24) })); }
    catch { /* Voice still works when browser storage is unavailable. */ }
  }
  navigate(path);
}
