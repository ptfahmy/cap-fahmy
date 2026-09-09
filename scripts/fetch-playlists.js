const fs = require("fs");
const path = require("path");

const PLAYLIST_IDS = [
  {
    id: "PLB51Myhdv9lskix2dw5dwFJRUCkIQxIvU",
    titleAr: "تمارين إطالة ثابتة",
  },
];

const CLIENT = {
  clientName: "WEB",
  clientVersion: "2.20250301.00.00",
};

function decodeXml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function walk(node, out = []) {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) {
    node.forEach((item) => walk(item, out));
    return out;
  }
  if (node.playlistVideoRenderer) {
    const r = node.playlistVideoRenderer;
    const id = r.videoId;
    const title =
      r.title?.runs?.[0]?.text ||
      r.title?.simpleText ||
      id;
    if (id) out.push({ id, title });
  }
  if (node.continuationItemRenderer) {
    const token =
      node.continuationItemRenderer?.continuationEndpoint?.continuationCommand
        ?.token;
    if (token) out.push({ __continuation: token });
  }
  Object.values(node).forEach((value) => walk(value, out));
  return out;
}

async function browse(body) {
  const res = await fetch(
    "https://www.youtube.com/youtubei/v1/browse?prettyPrint=false",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ context: { client: CLIENT }, ...body }),
    }
  );
  if (!res.ok) throw new Error(`browse failed: ${res.status}`);
  return res.json();
}

async function fetchPlaylist(meta) {
  const videos = [];
  const seen = new Set();
  let data = await browse({ browseId: `VL${meta.id}` });
  let title =
    data?.metadata?.playlistMetadataRenderer?.title ||
    data?.header?.pageHeaderRenderer?.pageTitle ||
    meta.id;

  for (let page = 0; page < 40; page += 1) {
    const found = walk(data);
    let next = null;
    for (const item of found) {
      if (item.__continuation) {
        next = item.__continuation;
        continue;
      }
      if (!seen.has(item.id)) {
        seen.add(item.id);
        videos.push({ id: item.id, title: item.title });
      }
    }
    if (!next) break;
    data = await browse({ continuation: next });
  }

  // Fallback to RSS if innertube returned nothing useful
  if (videos.length === 0) {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?playlist_id=${meta.id}`
    );
    const xml = await res.text();
    title = decodeXml((xml.match(/<title>([^<]+)<\/title>/) || [])[1] || title);
    const ids = [...xml.matchAll(/<yt:videoId>([^<]+)<\/yt:videoId>/g)].map(
      (m) => m[1]
    );
    const titles = [...xml.matchAll(/<media:title>([^<]*)<\/media:title>/g)].map(
      (m) => m[1]
    );
    ids.forEach((id, i) => {
      videos.push({ id, title: decodeXml(titles[i] || id) });
    });
  }

  return {
    id: meta.id,
    title,
    titleAr: meta.titleAr || title,
    url: `https://www.youtube.com/playlist?list=${meta.id}`,
    videos,
  };
}

async function main() {
  const playlists = [];
  for (const meta of PLAYLIST_IDS) {
    const playlist = await fetchPlaylist(meta);
    playlists.push(playlist);
    console.log(`${playlist.title}: ${playlist.videos.length} videos`);
  }
  const outPath = path.join(__dirname, "..", "playlists.json");
  fs.writeFileSync(outPath, JSON.stringify({ playlists }, null, 2));
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
