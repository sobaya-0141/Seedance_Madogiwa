# Madogiwa Studio MCP reference

## Connection

The public website is `https://madogiwa.work`. Use that origin for public episode/gallery links and completion reports. The admin UI remains at `https://madogiwa-studio.madogiwa-studio.workers.dev/admin`, and the authenticated MCP endpoint below is unchanged. Do not replace the MCP host with the public website host or rewrite one-time upload URLs returned by tools.

Endpoint:

```text
https://madogiwa-studio.madogiwa-studio.workers.dev/mcp
```

Codex project config (`.codex/config.toml`):

```toml
[mcp_servers.madogiwa-studio]
url = "https://madogiwa-studio.madogiwa-studio.workers.dev/mcp"
auth = "oauth"
default_tools_approval_mode = "writes"
```

Claude-compatible project config (`.mcp.json`) inside `mcpServers`:

```json
"madogiwa-studio": {
  "type": "http",
  "url": "https://madogiwa-studio.madogiwa-studio.workers.dev/mcp"
}
```

For Codex CLI, run `codex mcp login madogiwa-studio` after adding the config. Complete Cloudflare Access OAuth with an allowed email address, then restart the agent session if the tools are not discovered. Do not copy another user's OAuth cache. A new colleague must first be added to the Cloudflare Access allow policy.

The skill's `agents/openai.yaml` also declares this Remote MCP dependency for clients that support skill tool dependencies.

## Tools

- `list_members({})`: return canonical member IDs and display names.
- `list_episodes({ featuredOnly? })`: return episode summaries, Studio IDs, counts, members, primary video IDs, and featured-video flags. Set `featuredOnly: true` to filter.
- `get_episode({ slug })`: return one episode with generations, prompt history, input assets, and videos.
- `create_episode({ slug, title, summary?, status?, memberIds? })`: create a published episode and its automatic v1. Status is `published` or `archived`; omit it for the normal published state.
- `set_episode_members({ episodeId, memberIds })`: replace the member set.
- `create_generation({ episodeId, label?, modelName?, notes? })`: append the next version. Never pass a version number.
- `update_generation({ generationId, label?, modelName?, notes? })`: update generation metadata.
- `upsert_prompt({ generationId, label?, body })`: add a new current prompt revision and retain history.
- `register_youtube_video({ episodeId, youtubeId, generationId?, featured?, contentKind?, productionNotes? })`: register the official-channel video ID. Defaults: featured=false, contentKind=story, productionNotes=false. Notes require generationId. Idempotent for the same ID/episode; another episode cannot claim the same YouTube ID. Does not publish the YouTube video.
- `list_youtube_videos({ episodeId? })`: publication rows, state, is_active, checked_at, privacy/processing metadata. States: pending, processing, waiting_public, ready, unavailable, failed.
- `sync_youtube_videos({})`: check registered videos immediately. Cron also runs every five minutes. Public, processed, embeddable official-channel videos become active automatically. Pending replacements preserve the current active version.
- `create_input_upload({ generationId, filename, label, kind, referenceLabel?, groupLabel?, notes?, contentType?, displayOrder? })`: create an input row and return `{ assetId, uploadUrl, expiresAt }`. Kind is `image`, `audio`, `document`, or `other`.
- `set_video_status({ videoId, status })`: legacy R2 record maintenance only; does not affect YouTube publishing.
- `set_video_featured({ videoId, featured })`: legacy R2 record maintenance only. For YouTube use register_youtube_video with all current settings.
- `list_gallery_items({ includeArchived? })`: return gallery items in display order. Drafts are included; archived items are optional.
- `create_gallery_item({ slug, title, kind, displayOrder?, status? })`: create a gallery item. New items must receive an image before they can be published.
- `update_gallery_item({ galleryItemId, slug?, title?, kind?, displayOrder?, status? })`: update gallery metadata or set `draft`, `published`, or `archived`.
- `create_gallery_image_upload({ galleryItemId, filename, contentType })`: issue a one-time URL for a JPEG, PNG, or WebP gallery image up to 10MB.
- `reorder_gallery_items({ itemIds })`: replace gallery display order with the given UUID order.
- `list_articles({ includeArchived? })`: return articles in display order. Drafts are included; archived items are optional.
- `create_article({ slug, label, source, title, copy?, url, action, displayOrder?, status? })`: create an article link.
- `update_article({ articleId, slug?, label?, source?, title?, copy?, url?, action?, displayOrder?, status? })`: update or archive an article.
- `reorder_articles({ itemIds })`: replace article display order with the given UUID order.

IDs accepted by mutation tools are UUIDs returned by earlier tools. `studio_id` is user-facing and is not a mutation ID.

## Direct YouTube upload

Use the configured YouTube Data API resumable uploader in this environment, or the official channel's YouTube Studio if no API uploader is configured. Studio MCP registers IDs; it does not transfer video bytes to YouTube. The MMU-only uploader path is not a command available in this repository. Example API metadata:

```json
{
  "snippet": {
    "title": "作品タイトル｜窓際族物語",
    "description": "作品紹介\n\n公式サイト https://madogiwa.work",
    "categoryId": "24",
    "defaultLanguage": "ja",
    "defaultAudioLanguage": "ja"
  },
  "status": {
    "privacyStatus": "private",
    "selfDeclaredMadeForKids": false,
    "embeddable": true,
    "containsSyntheticMedia": true
  }
}
```

Set audience and synthetic-content disclosures according to the actual work. Preserve required VOICEVOX/asset credits. Only add a production-page link if productionNotes=true and that page is intended to be published. Use private for the initial upload; use public only with the user's publication authorization. IDs, URLs and SHA256 may be recorded in the repository. Access/refresh tokens and resumable session URLs must remain private.

Keep the resumable upload session private and use the uploader's resume command after interruption. A lost final response is recovered by querying the session. Expired sessions require checking the channel before starting another upload. Once an ID exists, register it immediately so Cloudflare can continue checking readiness independently.

## Linking both directions

Create the Studio episode first and obtain its stable slug. Build `https://madogiwa.work/episodes/<slug>` before uploading. Include that URL in the YouTube description only for a work with public production notes; otherwise include just `https://madogiwa.work`. After uploading, register the returned YouTube ID against the episode and selected generation, then publish on YouTube when authorized and run sync_youtube_videos. A new episode URL returns 404 until publication conditions are met. Processing can finish later; Cron continues checking independently.

## Input / gallery binary PUT

Only images, reference audio and documents are uploaded to Studio. Issue a ticket with create_input_upload or create_gallery_image_upload, then immediately PUT the selected file with its actual Content-Type. Keep the returned URL out of output and saved records. Verify ready with get_episode, or the gallery image_url.

Public notes show only the selected public YouTube version's notes, current prompt (when present), and ready inputs. Prompt history and unpublished versions remain private. Notes can be disabled entirely for videos such as explainers. Inputs use `/inputs/<assetId>` and gallery images `/gallery-images/<galleryItemId>`. Video `/media/<id>` and old clip MP4 URLs return 410; no new R2 video upload endpoint is available.
