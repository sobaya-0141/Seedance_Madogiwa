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
- `list_youtube_videos({ episodeId? })`: publication rows, state, is_active, checked_at, privacy/processing metadata, `publish_at` (YouTube's scheduled publish time; null when the private video has no schedule, kept after release). States: pending, processing, waiting_public, ready, unavailable, failed.
- `sync_youtube_videos({})`: check registered videos immediately. Cron also runs every five minutes. Public, processed, embeddable official-channel videos become active automatically. Pending replacements preserve the current active version. A scheduled video stays `waiting_public` and hidden everywhere on the site until YouTube publishes it; the episode is then listed at its release time (newest first), so scheduled videos can be registered ahead of time without reordering.
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

Use `tools/youtube_upload.py` in this repository (YouTube Data API v3 resumable uploader; per-member setup in SKILL.md "`tools/youtube_upload.py` の導入"), or the official channel's YouTube Studio if it is not set up on this machine. Studio MCP registers IDs; it does not transfer video bytes to YouTube. The MMU-only uploader path is not a command available in this repository. Example API metadata:

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
    "privacyStatus": "public",
    "selfDeclaredMadeForKids": false,
    "embeddable": true,
    "containsSyntheticMedia": true
  }
}
```

Set audience and synthetic-content disclosures according to the actual work. Preserve required VOICEVOX/asset credits. Only add a production-page link if productionNotes=true and that page is intended to be published. A Studio video-registration request authorizes publishing the adopted video: explicitly set public unless the user requests private, unlisted, scheduled publication, or records only. For an existing private ID, update its visibility instead of uploading again. Neither register_youtube_video nor Cron changes YouTube privacy; resolve waiting_public in this registration task and sync again. IDs, URLs and SHA256 may be recorded in the repository. Access/refresh tokens and resumable session URLs must remain private.

Keep the resumable upload session private and use the uploader's resume command after interruption. A lost final response is recovered by querying the session. Expired sessions require checking the channel before starting another upload. Once an ID exists, register it immediately so Cloudflare can continue checking readiness independently.

## Scheduled release (2026-11-19)

Use only when the user explicitly asks for a scheduled release. On YouTube, keep the video private and set its schedule (`status.privacyStatus: "private"` with `status.publishAt`, a future ISO 8601 timestamp with time zone such as `2027-01-01T00:00:00+09:00`). `tools/youtube_upload.py` does not send `publishAt`; upload as private and set the schedule in YouTube Studio, or with an authenticated `videos.update` call. Do not switch to unlisted or create a Premiere.

Register the ID with `register_youtube_video` right away, run `sync_youtube_videos`, and confirm with `list_youtube_videos` that the state is `waiting_public` and `publish_at` matches the intended time. Do not make the video public early. After the scheduled time the site lists the episode within about five minutes with no further action, sorted by its release time. Before that, the episode page, lists, production notes and sitemap show nothing, so a surprise release needs no extra handling. A production-page URL written in the description beforehand returns 404 until release and becomes valid at release.

A `waiting_public` row whose `publish_at` is empty is not scheduled: it was left private or unlisted. Fix its visibility unless the user asked to keep it that way.

## Linking both directions

Create the Studio episode first and obtain its stable slug. Build `https://madogiwa.work/episodes/<slug>` before uploading. Include that URL in the YouTube description only for a work with public production notes; otherwise include just `https://madogiwa.work`. After uploading, register the returned YouTube ID against the episode and selected generation, then publish on YouTube as part of the registration request (unless explicitly instructed otherwise) and run sync_youtube_videos. A new episode URL returns 404 until publication conditions are met. Processing can finish later; Cron continues checking independently.

## Input / gallery binary PUT

Only images, reference audio and documents are uploaded to Studio. Issue a ticket with create_input_upload or create_gallery_image_upload, then immediately PUT the selected file with its actual Content-Type. Keep the returned URL out of output and saved records. Verify ready with get_episode, or the gallery image_url.

Public notes show only the selected public YouTube version's notes, current prompt (when present), and ready inputs. Prompt history and unpublished versions remain private. Notes can be disabled entirely for videos such as explainers. Inputs use `/inputs/<assetId>` and gallery images `/gallery-images/<galleryItemId>`. Video `/media/<id>` and old clip MP4 URLs return 410; no new R2 video upload endpoint is available.
