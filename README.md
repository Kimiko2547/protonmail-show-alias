# Proton Mail - Show Alias (Userscript)

**TL;DR**: Hotkey **Alt+Shift+X** (or toolbar button) → opens **View headers** → extracts `X-Original-To` → copies to clipboard → shows **Alias …** inline after the first recipient.

---

## Features
- One-key **open → parse → copy** workflow.
- `Alias you@alias.tld` displayed after the first recipient label.
- **Copy icon** will copy to clipbaord.

---

## Install (Tampermonkey/Violentmonkey)
1. Install a userscript manager (Tampermonkey or Violentmonkey).
2. Create a new script and paste the contents of the userscript **or** install from file:
   - **Userscript file**: [protonmail-show-alias.user.js](https://github.com/Kimiko2547/Protonmail-Show-Alias/blob/main/protonmail-show-alias.user.js)
   - **Install link :**: [Raw userscript](https://raw.githubusercontent.com/Kimiko2547/protonmail-show-alias/main/protonmail-show-alias.user.js)

---

## Usage
- Open **https://mail.proton.me** and any message.
- Press **Alt+Shift+X** *or* click the injected **Show Alias** button in the message toolbar.
- The script will:
  1. Click **More** (⋯) → **View headers**,
  2. Extract `X-Original-To` (fallback: `Delivered-To`, then `To`),
  3. Copy it to the clipboard and show a toast,
  4. Insert `Alias …` after the first `recipient-label` with a **copy** icon.

---

## How it finds things (repo-aware)
Stable hooks taken from Proton’s WebClient:
- Kebab (More): `data-testid="message-header-expanded:more-dropdown"`
- Menu item: `data-testid="message-view-more-dropdown:view-message-headers"`
- Headers modal root: `.message-headers-modal`
- To row label: `data-testid="recipient-label"`

---

## Troubleshooting
- **Nothing happens**: ensure Tampermonkey/Violentmonkey is enabled on `https://mail.proton.me/*`.
- **Menu not found**: report issue.
- **Clipboard blocked**: your browser may restrict programmatic copy. The script falls back to a prompt.

---

## Privacy
- Runs locally in your browser. No network calls. No data leaves your machine.

---

## File list
- `userscript/protonmail-show-alias.user.js` — main userscript (v1.0.0).

---

## Changelog
- **v1.0.0**: Initial stable repo-aware version.

---

## Links

- **Install:** [Raw userscript](https://raw.githubusercontent.com/Kimiko2547/protonmail-show-alias/main/protonmail-show-alias.user.js)
- **Homepage:** https://github.com/Kimiko2547/protonmail-show-alias
- **Issues:** https://github.com/Kimiko2547/protonmail-show-alias/issues

---

## License
MIT — do whatever, just keep the notice.

---

## Credits
- ChatGPT v5.1 Code Copilot. 
