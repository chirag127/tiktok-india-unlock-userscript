---
type: Script
title: TikTok India Unlock
description: Hands a TikTok link to a working mirror when tiktok.com is blocked or region-gated, with an editable mirror list.
repo: https://github.com/chirag127/tiktok-india-unlock-userscript
install: https://github.com/chirag127/tiktok-india-unlock-userscript/raw/main/tiktok-india-unlock-userscript.user.js
version: "1.0.0"
tags: [userscript, tiktok]
timestamp: 2026-11-09T00:00:00Z
---

# TikTok India Unlock

Hands a TikTok link to a working mirror when tiktok.com is blocked or region-gated, with an editable mirror list.

## Method

URL parsing for video id/handle, template expansion, `window.open` handoff, GM-stored mirror list.

## Limits

- A userscript cannot run on a domain that never loads, so this is a handoff, not a tunnel
- Mirrors die often, edit the list
- No login on mirrors
