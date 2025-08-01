"use strict";

(function () {
    const MOCK_COVER = "blob_mock.svg";
    const POLL_INTERVAL_MS = 15000;

    let lastFmUsername = null;
    let lastFmApiKey = null;
    let intervalId = null;

    const cover  = document.getElementById("cover");
    const track  = document.getElementById("trackname");
    const artist = document.getElementById("artist");

    cover.addEventListener("error", () => {
        cover.src = MOCK_COVER;
    });

    window.Twitch.ext.onAuthorized(loadConfig);
    window.Twitch.ext.configuration.onChanged(() => {
        loadConfig();
        fetchScrobblingNow();
    });

    function loadConfig() {
        const configStr = window.Twitch.ext.configuration?.broadcaster?.content;
        if (!configStr) return;

        try {
            const config = JSON.parse(configStr);
            lastFmUsername = config.lastFmUsername;
            lastFmApiKey = config.lastFmApiKey;

            if (lastFmUsername && lastFmApiKey) {
                fetchScrobblingNow();

                if (intervalId) clearInterval(intervalId);
                intervalId = setInterval(fetchScrobblingNow, POLL_INTERVAL_MS);
            }
        } catch (err) {
            console.error("Invalid config JSON:", err);
        }
    }

    function updateTrackInfo(coverUrl, trackName, artistName) {
        cover.src = coverUrl || MOCK_COVER;
        track.textContent  = trackName || "nothing";
        artist.textContent = artistName || "";
    }

    async function fetchScrobblingNow() {
        if (!lastFmUsername || !lastFmApiKey) return;

        const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastFmUsername}&api_key=${lastFmApiKey}&extended=1&format=json&limit=1`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            const trackData = data?.recenttracks?.track?.[0];
            if (!trackData || !trackData["@attr"]?.nowplaying) {
                updateTrackInfo(MOCK_COVER, "nothing", "");
                return;
            }

            const coverUrl   = trackData.image?.[2]?.["#text"] || MOCK_COVER;
            const trackName  = trackData.name ? (trackData.loved === "1" ? "❤️ " : "") + trackData.name : "";
            const artistName = trackData.artist?.name ? `by ${trackData.artist.name}` : "";

            updateTrackInfo(coverUrl, trackName, artistName);
        } catch (err) {
            console.error("Last.fm fetch failed:", err);
        }
    }
})();
