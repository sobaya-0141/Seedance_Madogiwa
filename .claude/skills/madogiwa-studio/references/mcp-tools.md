# Madogiwa Studio MCP reference

## Connection

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
- `create_episode({ slug, title, summary?, status?, memberIds? })`: create an episode and its automatic v1. Status is `draft`, `generated`, `published`, or `archived`.
- `set_episode_members({ episodeId, memberIds })`: replace the member set.
- `create_generation({ episodeId, label?, modelName?, notes? })`: append the next version. Never pass a version number.
- `update_generation({ generationId, label?, modelName?, notes? })`: update generation metadata.
- `upsert_prompt({ generationId, label?, body })`: add a new current prompt revision and retain history.
- `create_video_upload({ generationId, filename, label?, contentType?, featured? })`: create a video row and return `{ videoId, uploadUrl, posterUploadUrl, expiresAt }`. Put the video into `uploadUrl` and a JPEG/PNG/WebP poster (5MB or less) into `posterUploadUrl`. Use `featured: true` for an official-site pick-up video.
- `create_input_upload({ generationId, filename, label, kind, referenceLabel?, groupLabel?, notes?, contentType?, displayOrder? })`: create an input row and return `{ assetId, uploadUrl, expiresAt }`. Kind is `image`, `audio`, `document`, or `other`.
- `set_video_status({ videoId, status })`: set `upload_pending`, `ready`, `published`, or `archived`.
- `set_video_featured({ videoId, featured })`: enable or disable official-site pick-up priority for an existing video.
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

## Binary PUT

Send the file body to the returned one-time URL with its actual MIME type. Keep the URL out of command output.

```sh
curl --fail-with-body --silent --show-error \
  --request PUT \
  --header 'Content-Type: video/mp4' \
  --data-binary @path/to/video.mp4 \
  '<one-time-upload-url>'
```

Generate and upload a poster before uploading the video:

```sh
ffmpeg -hide_banner -loglevel error -y \
  -ss 0.5 -i path/to/video.mp4 -frames:v 1 \
  -vf scale=1280:1280:force_original_aspect_ratio=decrease \
  -q:v 3 path/to/poster.jpg

curl --fail-with-body --silent --show-error \
  --request PUT \
  --header 'Content-Type: image/jpeg' \
  --data-binary @path/to/poster.jpg \
  '<one-time-poster-upload-url>'
```

Typical MIME types:

- MP4: `video/mp4`
- PNG: `image/png`
- JPEG: `image/jpeg`
- WAV: `audio/wav`
- MP3: `audio/mpeg`
- Plain prompt or notes: `text/plain; charset=utf-8`
- PDF: `application/pdf`

After both PUTs, verify with `get_episode`: status must be `ready`, and `size_bytes` and `poster_r2_key` must be nonnull. Public media URLs are `/media/<videoId>`, `/posters/<videoId>`, and `/inputs/<assetId>`.

Uploaded gallery images are served from `/gallery-images/<galleryItemId>`; use the `image_url` returned by list and mutation tools.
