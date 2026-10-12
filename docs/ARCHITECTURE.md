# CreatorHub Video Architecture

How a video gets from a creator's device to a paying viewer:
**Creator Upload → Processing → Storage → Delivery → Playback**.

Components are named generically, with an example service in brackets. The
design depends on the pattern, not on one vendor.

![CreatorHub video architecture](architecture.png)

The diagram above is exported from [`architecture.drawio`](architecture.drawio)
(open it in draw.io to edit). The Mermaid version below renders directly on
GitHub.

## System diagram

Numbered steps follow one video from upload to playback.

```mermaid
flowchart LR
  C["👤 Creator<br/>web / mobile"]
  V["👤 Viewer<br/>HLS player"]

  subgraph APP["Application"]
    API["App API (Next.js)<br/>auth · presigned URLs<br/>playback tokens"]
    DB[("Metadata DB<br/>Postgres")]
    PAY["Payments<br/>Stripe"]
  end

  subgraph PROC["Upload and processing"]
    RAW[("Uploads bucket<br/>originals · S3/R2")]
    Q[["Job queue<br/>SQS"]]
    VAL["Validate and probe<br/>ffprobe"]
    TX["Transcode workers<br/>ffmpeg on spot"]
    HOT["Popularity job<br/>adds renditions"]
    COLD[("Archive tier<br/>originals after 30 days")]
  end

  subgraph DELIVERY["Storage and delivery"]
    OUT[("Delivery bucket<br/>HLS/CMAF + thumbnails")]
    SHIELD["Origin shield"]
    EDGE["CDN edge<br/>token check + cache"]
  end

  C -- "① request upload" --> API
  API -. "② presigned part URLs" .-> C
  C -- "③ parts uploaded directly, resumable" --> RAW
  RAW -- "④ object-created event" --> Q
  Q --> VAL
  VAL -- "valid" --> TX
  VAL -. "invalid → FAILED" .-> DB
  TX -- "⑤ 360p + 720p ladder, thumbnails" --> OUT
  TX -. "status READY" .-> DB
  RAW -. "lifecycle rule" .-> COLD
  DB -. "view counts" .-> HOT
  HOT -- "enqueue 1080p" --> Q

  V -- "⑥ buy" --> PAY
  PAY -- "webhook: grant entitlement" --> API
  API --> DB
  V -- "⑦ request playback" --> API
  API -. "⑧ short-lived signed token" .-> V
  V -- "⑨ manifest + segments with token" --> EDGE
  EDGE -- "cache miss" --> SHIELD
  SHIELD -- "cache miss" --> OUT
```

## Paid playback sequence

How a shared link stops working for someone who did not pay.

```mermaid
sequenceDiagram
  participant V as Viewer
  participant API as App API
  participant DB as Metadata DB
  participant E as CDN edge
  participant O as Delivery bucket

  V->>API: GET /videos/:id/playback (session cookie)
  API->>DB: Is there an entitlement for this user and video?
  alt not entitled
    API-->>V: 402 / 403, show purchase screen
  else entitled
    API-->>V: Manifest URL + signed token (video id, user id, expires in minutes)
    V->>E: GET manifest and segments with token
    E->>E: Verify signature, expiry and path prefix
    alt token invalid or expired
      E-->>V: 403 (player asks the API for a new token)
    else token valid
      E->>O: Fetch on cache miss only
      O-->>E: Segment
      E-->>V: Segment (cached at the edge for other entitled viewers)
    end
  end
```

## What the diagram shows

- **Large files never pass through the app server.** The API only issues
  presigned multipart URLs. The upload goes straight from the device to the
  bucket in independently retried parts, so a dropped connection costs one
  part rather than the whole file.
- **Processing is event-driven and asynchronous.** The bucket emits an
  event, a queue absorbs bursts, and workers scale with queue depth. Spot
  capacity is safe here because a failed job is simply retried.
- **Validation runs before transcoding.** Corrupt, unsupported or oversized
  files fail cheaply at the `ffprobe` step, before any transcoding spend.
- **Transcoding is tiered by demand.** Every video gets a small base ladder
  (360p and 720p). Higher renditions are added only when the popularity job
  sees real demand, so a video with 5 views costs far less than one with
  500,000.
- **Storage is split by access pattern.** Originals go to an archive tier
  after 30 days and can be re-transcoded from there. Delivery segments stay
  in standard storage behind the CDN. Metadata lives in Postgres, never in
  object storage.
- **Every request is authorized at the edge.** Segment URLs are useless
  without a short-lived token tied to the user, the video and an expiry
  time, so copying a URL does not grant lasting access. Edge caching still
  works because the token is checked before the cache lookup and is not
  part of the cache key.
- **An origin shield protects the bucket.** Each segment is fetched from
  storage roughly once per region and served from cache afterwards. This
  cuts origin egress and request costs.

---

## A. Upload

**Large files never pass through the application server.** Routing
gigabytes through the API would tie up app instances for minutes per
upload, double the bandwidth bill (in and then out again to storage), and
make the API's availability depend on upload traffic. The API only does
cheap control-plane work: it authenticates, validates the declared file,
creates the content record and returns presigned URLs.

| Concern | Approach |
|---|---|
| Files from MB to GB | S3/R2 **multipart upload**: parts of 8–16 MB (5 MB on mobile), uploaded 3–4 in parallel with presigned part URLs. |
| Slow connections | Smaller parts on mobile or slow links (measured from the first parts' throughput), so a failed part costs seconds, not minutes. |
| Interrupted uploads | The upload ID and completed part numbers are kept in IndexedDB. On reconnect the client calls `ListParts` and continues from the next missing part. A lifecycle rule aborts incomplete multipart uploads after 7 days, so abandoned parts don't keep costing money. |
| Progress | Computed client-side from bytes acknowledged per part. Shown as a progress bar with a percentage, plus Pause, Resume and Cancel. |
| Validation | **Before upload:** extension, MIME type and size limits (implemented in the demo). **After upload:** `ffprobe` checks the real container and codec, duration, resolution and integrity. The file's declared type is never trusted. |
| Mobile | The upload starts the moment a file is picked, while the creator types the details (implemented). Uploads keep running in the background where the platform allows it, and the screen is kept awake during foreground uploads. |
| Integrity | Each part carries an MD5 or CRC32C checksum; storage rejects corrupted parts. |

## B. Processing

An object-created event goes onto a queue. Workers pull jobs, so traffic
spikes queue up instead of failing. Jobs are idempotent, keyed by
`videoId + rendition`, so retries are safe. A job that keeps failing lands
in a dead-letter queue, and the content is marked `FAILED` in the creator's
UI, with a one-click retry.

1. **Validate and probe** with `ffprobe`. Corrupt, unsupported or oversized
   files are rejected **before any transcoding spend**.
2. **Extract metadata**: duration, resolution, frame rate, audio channels and
   rotation, stored in Postgres.
3. **Generate images**: a poster frame, 3 suggested thumbnails taken at
   keyframes, and a sprite sheet for seek-bar previews.
4. **Transcode a base ladder**: 360p (~0.8 Mbps) and 720p (~2.5 Mbps) H.264/AAC,
   as **CMAF** (fMP4) segments of 4–6 s. One set of segments serves both
   **HLS** (Apple and most players) and **DASH**, so storage isn't duplicated.
5. **Add more renditions only when demand justifies them.** See F.

Cost guards in processing:

- **Never upscale**: the ladder is capped at the source resolution.
- **Remux instead of re-encoding** when the source already matches a target
  rendition (codec, bitrate and keyframe interval within tolerance).
- **Deduplicate**: a content hash of the upload catches identical re-uploads.
- **Spot or preemptible workers**, autoscaled on queue depth (safe because
  jobs are idempotent and retryable).
- **Per-title encoding later**: simple talking-head videos need far fewer
  bits than action footage at the same quality.

## C. Storage

| Data | Where | Why |
|---|---|---|
| Original upload | Object storage, moved by a lifecycle rule to an infrequent-access tier after 30 days and to archive after 180 | It's needed only to re-transcode (new codec, new rendition), which is rare. Keeping it lets us re-encode without asking the creator to upload again. |
| Processed renditions | Object storage, standard tier (intelligent tiering for the long tail) | Read by the CDN origin shield only on a cache miss. Immutable, versioned paths (`/v/{videoId}/{renditionVersion}/…`) allow year-long cache TTLs. |
| Thumbnails and sprites | Object storage behind the CDN | Small, heavily read and immutable, so they are almost always served from the edge. |
| Metadata, purchases, entitlements | **Postgres** | Relational and transactional. A purchase and its entitlement must be consistent, and reporting needs joins and aggregates. Read replicas take the dashboard queries. |

I'd lean towards **Cloudflare R2** or S3 with CloudFront. R2 charges
nothing for egress, which removes the "storage → CDN" bandwidth line
entirely. S3 with CloudFront is similar because S3-to-CloudFront transfer
is free, and it has a more mature transcoding ecosystem. Either way the
pattern is identical.

## D. Streaming and delivery

- **CDN edge caching** with an **origin shield** (one regional cache in
  front of storage), so each segment leaves storage about once per region.
- **Adaptive bitrate (HLS/DASH)**: the player switches renditions per
  segment as bandwidth changes, so a viewer on a slow mobile network gets
  360p instead of buffering.
- **Startup time**:
  - start at a low rendition and step up;
  - keep the first segments short;
  - preconnect to the CDN origin;
  - show the poster frame immediately;
  - prefetch the manifest and first segment when the viewer hovers or opens
    the page.
- **Seeking**: segments start on keyframes, so a seek fetches exactly one
  segment; the thumbnail sprite gives instant previews.
- **Caching policy**: segments are immutable, so their TTL is 1 year. Paid
  manifests are short-lived and never shared-cached across users. The
  authorization token is **not** part of the cache key, so one cached
  segment serves every entitled viewer.
- **Popular vs rarely viewed**: popular segments stay hot at hundreds of
  edge locations. Long-tail content is served from the shield, which still
  avoids most origin reads. Trending videos can be pre-warmed.
- **Multiple countries**: the CDN's global points of presence handle
  geography. A single origin region plus a shield is enough until data
  shows otherwise.

## E. Paid content protection

The goal is that a copied URL is useless to anyone who didn't pay.

1. The viewer asks the API for playback (`GET /videos/:id/playback`) with
   their session.
2. The API checks the **entitlement** (a purchase row created by the
   payment provider's webhook, never by the client).
3. The API returns a **short-lived signed token or cookie**:
   - scoped to the path prefix `/v/{videoId}/*`;
   - containing the user ID and an expiry of about 10 minutes;
   - signed with a key that only the API and the CDN know.
4. A **CDN edge function** checks the signature, expiry and path on every
   manifest and segment request before the cache lookup. An invalid or
   expired token gets 403.
5. The player refreshes the token through the API before it expires, so
   long viewing sessions continue seamlessly.

Extras as the business needs them:

- concurrent-stream limits per user (enforced at token issuance);
- soft binding of tokens to an IP range or network;
- forensic watermarking to trace leaked screen recordings;
- DRM (Widevine/FairPlay) for premium catalogs.

As the brief notes, DRM isn't needed now; signed short-lived URLs stop
casual link sharing at a fraction of the complexity.

## F. Cost efficiency: should 5 views and 500,000 views be treated the same?

**No.** Most videos on creator platforms get very few views, and a small
number get most of the traffic. Spending the same on both wastes money on
the long tail and under-invests in the hits.

| Tier | Trigger | What we do |
|---|---|---|
| Every upload | Always | Validate first, then the base ladder (360p + 720p H.264), poster and sprite. Cheap and plays everywhere. |
| Warm | e.g. > 1,000 views in 7 days | Add 1080p. Higher quality where it's actually watched. |
| Hot | e.g. > 50,000 views in 7 days | Add **AV1/HEVC** renditions. They cost ~10× more compute to encode but cut bandwidth 30–50%, which only pays back at high view counts. Pre-warm edges. |
| Cold | No views in 90 days | Originals already in archive. Renditions move to an infrequent-access tier; the shield absorbs the occasional view. |

A nightly job reads view counts from analytics and enqueues promotion jobs.
The rule is simple: **spend compute only where it will be repaid in
bandwidth saved or experience improved.**

Other savings:

- Free egress between storage and CDN (R2, or S3 to CloudFront), and an
  origin shield.
- Long immutable TTLs, so repeat requests never reach the origin.
- One CMAF set serves both HLS and DASH (no duplicate storage).
- Lifecycle rules on originals and on incomplete multipart uploads.
- Spot workers for transcoding.

---

## Scale and cost challenge

**Assumptions:** 100,000 creators; 1,000,000 stored videos; 10 million views
per month; viewers in many countries.

### What scales easily

- **Object storage and the CDN.** Both are effectively unlimited managed
  services that are already global.
- **Transcoding.** It's queue-driven and stateless, so throughput grows by
  adding spot workers.
- **The stateless app and API tier.** It scales horizontally behind a load
  balancer, and uploads never pass through it.

### Likely bottlenecks

- **Postgres**:
  - dashboard aggregates over large purchase tables. Fix: pre-aggregated
    daily rollups and read replicas.
  - hot rows such as view counters. Fix: count views in an analytics
    pipeline, not with per-view `UPDATE`s.
- **Upload bursts**: many uploads after a viral event. The queue absorbs
  them, but time-to-publish grows; autoscale on queue age, not just depth.
- **Playback token issuance**, one call per viewer start and per refresh.
  It's cheap and stateless, but it's on the critical path. Cache
  entitlements in Redis and keep token signing local, with no database call
  on refresh.

### What gets expensive

**CDN bandwidth, by a wide margin.** Transcoding and storage come next.

### What I'd monitor

| Area | Metrics |
|---|---|
| Upload | Success rate; resume rate; time to "ready"; size and failure reasons by device type |
| Processing | Queue depth and age; job failure rate; dead-letter count; encode cost per minute |
| Delivery | CDN cache hit ratio (edge and shield); origin egress; 4xx/5xx by region |
| Playback | Video startup time (p50/p95); rebuffering ratio; average bitrate delivered; playback failures by device |
| Business | Purchase → playback success; refund rate; token rejections (spikes may signal link sharing or a bug) |

### What I'd change as traffic grows

1. Introduce the demand-tiered renditions as soon as the bandwidth bill is
   meaningful.
2. Negotiate committed-use CDN pricing, or go multi-CDN with traffic
   steering by price and performance per region.
3. Move dashboard analytics to an OLAP store (ClickHouse/BigQuery) fed by
   events.
4. Add per-title encoding.
5. Add a second origin region only if shield-miss latency in far regions
   shows up in startup-time metrics.

### Rough monthly cost estimate

List prices were checked in October 2026 (sources at the end of this
section). As the brief says, the assumptions and reasoning matter more than
the exact totals, so every line shows its working.

#### Assumptions

| Input | Value | Why |
|---|---|---|
| Views per month | 10,000,000 | From the brief |
| Average watch time per view | 8 minutes (480 s) | Viewers rarely finish long videos; creator tutorials typically run 8–15 min |
| Blended delivered bitrate | ~2 Mbps | Adaptive streaming mixes 360p (~0.8 Mbps), 720p (~2.5 Mbps) and some 1080p |
| Stored videos | 1,000,000, averaging 10 minutes | From the brief; length assumed |
| New uploads | ~50,000 per month (500,000 minutes) | 100,000 creators uploading about one video every two months |
| Original file size | ~750 MB (10 min at ~10 Mbps) | Typical phone or camera export |
| Renditions per video | 360p + 720p ≈ 250 MB (3.3 Mbps × 600 s); 1080p for ~5% of videos | The demand-tiered ladder in section F |
| Segment length | 6 s, so ~80 segment requests per view, plus manifests | Common HLS/CMAF setting |
| Units | 1 PB = 1,000 TB = 1,000,000 GB (decimal, as providers bill) | |

#### Line by line

**1. CDN bandwidth: the dominant cost.**
10M views × 480 s × 2 Mbps = 960 Mb = **120 MB per view**, so
10M × 120 MB = **1.2 PB (1,200,000 GB) a month**.

At CloudFront's published North America/Europe tiers:

| Tier | Volume | Rate | Cost |
|---|---|---|---|
| First 10 TB | 10,000 GB | $0.085 | $850 |
| Next 40 TB | 40,000 GB | $0.080 | $3,200 |
| Next 100 TB | 100,000 GB | $0.060 | $6,000 |
| Next 350 TB | 350,000 GB | $0.040 | $14,000 |
| Next 524 TB | 524,000 GB | $0.030 | $15,720 |
| Remaining 176 TB | 176,000 GB | $0.025 | $4,400 |
| **Total** | **1,200,000 GB** | **~$0.037 average** | **~$44,200** |

Viewers in Asia, South America and Africa are billed at higher regional
rates, so a global audience pushes this up. At this volume, though, no one
pays list price: committed-use contracts and video-focused CDNs are
typically **$0.008–0.02/GB**, which is **$10–25k**. Delivering from
Cloudflare R2 removes the storage-to-CDN egress line entirely.

**2. CDN requests and edge authorisation.**
10M views × ~85 requests (segments + manifests) ≈ 850M requests.
HTTPS requests at $0.01 per 10,000 = **$850**. A token-checking edge function
(CloudFront Functions, $0.10 per million) adds **$85**. About **$1k** in
total.

**3. Rendition storage.**
1M videos × 250 MB = 250 TB, plus 1080p for ~50,000 popular videos
(5 Mbps × 600 s ≈ 375 MB each, so ~19 TB): **~270 TB**.
On R2 at $0.015/GB that's **$4.0k**; on S3 Standard at ~$0.022/GB it's **$5.9k**.

**4. Original storage, tiered by age.**
750 TB in total, moved by lifecycle rules:

| Age | Volume | Class | Rate | Cost |
|---|---|---|---|---|
| Under 30 days | ~37.5 TB (one month of uploads) | S3 Standard | $0.023/GB | $860 |
| 30–180 days | ~187.5 TB (five months) | Glacier Instant Retrieval | $0.004/GB | $750 |
| Over 180 days | ~525 TB | Glacier Deep Archive | $0.00099/GB | $520 |
| **Total** | **750 TB** | | | **~$2.1k** |

Re-transcoding an old video from Deep Archive takes up to 12 hours, which
is acceptable because it only happens when a codec or ladder changes.
Without tiering, the same 750 TB on S3 Standard would cost about **$17k**
a month.

**5. Transcoding.**
500,000 new minutes × 2 base renditions = 1M output minutes, plus 1080p and
AV1 promotions for the small share of videos that earn them.
- **Self-managed ffmpeg on spot instances:** roughly $0.001–0.003 per
  output minute, so **~$1–3k**.
- **For comparison, AWS MediaConvert** (Basic tier): 720p is billed as HD
  at 2 × $0.0075 = $0.015/min and 360p as SD at $0.0075/min, so
  500,000 × $0.0225 = **~$11k**. It's simpler to run, at about 5× the cost.

**6. Application platform.**
Autoscaled API containers (~$1–2k), managed Postgres with a read replica
(~$1–2k), and queues, functions, logging and monitoring (~$1–2k):
**~$3–6k**. This is small because video bytes never pass through the API.

#### Total

| Item | List price | Optimised |
|---|---|---|
| CDN bandwidth | $44k (CloudFront list) | $10–25k (committed / video CDN) |
| CDN requests + edge auth | $1k | $1k |
| Rendition storage | $6k (S3) | $4k (R2) |
| Original storage | $2k (tiered) | $2k (tiered) |
| Transcoding | $1–3k (spot ffmpeg) | $1–3k (spot ffmpeg) |
| Application platform | $3–6k | $3–6k |
| **Total per month** | **~$57–62k** | **~$21–41k** |
| **Cost per view** | **~$0.006** | **~$0.002–0.004** |

**Largest cost as the platform scales: CDN bandwidth**, at 70–75% of the
list-price total and 50–60% of the optimised total. It grows with every
view and minute watched, while storage and transcoding grow only with
uploads. So the main cost levers are bandwidth levers:

- **CDN pricing:** moving from list price to a committed rate saves
  $19–34k a month, more than every other line combined.
- **Watch time and bitrate:** each extra minute of average watch time adds
  ~12% to bandwidth (~$5.5k at list price), and lowering the blended
  bitrate by 10% saves about the same.
- **Better codecs for popular videos:** if half of all views come from
  videos with an AV1 rendition at ~35% lower bitrate, bandwidth drops by
  ~17%.
- **Cache hit ratio:** an origin shield keeps storage reads and egress low
  as traffic grows.

**Sources (list prices, October 2026):**
[Amazon CloudFront pricing](https://aws.amazon.com/cloudfront/pricing/),
with the tier ladder summarised by [egresscost.com](https://egresscost.com/aws/cloudfront-pricing);
[Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/);
[Amazon S3 pricing](https://aws.amazon.com/s3/pricing/), with storage-class rates summarised by [Upstash](https://upstash.com/blog/aws-s3-pricing-explained-2026);
[AWS Elemental MediaConvert pricing](https://aws.amazon.com/mediaconvert/pricing/).
Rates vary by region and change over time; check the providers' pages
before budgeting.
