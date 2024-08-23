---
title: ⚙️ Core Features
description: PearAI is the open-source autopilot for software development
keywords: [core-features, intro, continue, autopilot, chatgpt]
---

# ⚙️ Core Features

- `CMD+I` Inline code editing.

- `CMD+L` New chat – `CMD+SHIFT+L` Append to current chat.

  - Address sign commands
    - `@filename/foldername`, `@docs` Add files, folders or documentation. You can also choose to add your own documentation links by scrolling all the way down and clicking “Add Docs”.
    - All the other address sign commands in this [doc](https://docs.continue.dev/customization/context-providers). We want them to be indicated on one bullet point each, so can be seen easily as a list. In the doc in the link, it’s too separated, requiring having to scroll down too much.
  - Slash commands

    - `/commit` generates a commit message for all your current changes.
    - `/cmd` Generate a CLI command and paste it in the terminal directly.
    - `/edit` Bring code to your chat with `CMD+L` or `CMD+SHIFT+L` (`CTRL` for Windows)
    - `/comment` Works just like `/edit` but adds comments to your code
    - `/test` Works just like `/edit` but makes unit tests for highlighted or provided code.
    - Include the [excerpt](https://docs.continue.dev/customization/slash-commands#custom-slash-commands) about custom slash commands

  - Quick terminal debug: use `CMD+SHIFT+R` Bring last terminal text to your chat.
