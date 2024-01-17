"use strict";

(function () {
    const MOCK_COVER = "blob_mock.svg";
    let lastFmUsername;
    let lastFmApiKey;

    window.Twitch.ext.onAuthorized(() => {
        loadConfig();
    });

    window.Twitch.ext.configuration.onChanged(() => {
        loadConfig();
        fetchScrobblingNow();
    });

    function loadConfig() {
        const broadcasterConfig = window.Twitch.ext.configuration.broadcaster;
        if (broadcasterConfig && broadcasterConfig.content) {
            try {
                const configParsed = JSON.parse(broadcasterConfig.content);
                lastFmUsername = configParsed.lastFmUsername;
                lastFmApiKey = configParsed.lastFmApiKey;
            } catch (error) {
                console.error(error);
            }
        }
    }

    function replace404IMGtoMock() {
        document.getElementById("cover").src = MOCK_COVER;
    }

    function updateTrackInfo(coverUrl, trackname, artist) {
        let coverElement = document.getElementById("cover");
        let tracknameElement = document.getElementById("trackname");
        let artistElement = document.getElementById("artist");

        coverElement.src = coverUrl;
        tracknameElement.textContent = trackname;
        artistElement.textContent = artist;

        coverElement.addEventListener("error", replace404IMGtoMock);
    }

    function fetchScrobblingNow() {
        if (!lastFmUsername || !lastFmApiKey) {
            console.error("Last.fm API credentials are undefined.");
            return;
        }

        fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastFmUsername}&api_key=${lastFmApiKey}&extended=1&format=json&limit=1`)
            .then((response) => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("Error parsing JSON response: " + response.status);
                }
            })
            .then((data) => {
                let recentTrack = data.recenttracks.track[0];
                let coverUrl = recentTrack.image[2]["#text"] || MOCK_COVER;
                let trackname =
                    recentTrack.loved === "1"
                        ? `❤️ ${recentTrack.name}`
                        : recentTrack.name;
                let artist = recentTrack.artist["name"];
                recentTrack?.["@attr"]?.nowplaying
                    ? updateTrackInfo(coverUrl, trackname, `by ${artist}`)
                    : updateTrackInfo(coverUrl, "nothing", "");
            })
            .catch((error) => {
                console.error("Error occurred while fetching info from Last.fm: ", error);
            });
    }

    setInterval(fetchScrobblingNow, 15 * 1000);
})();
