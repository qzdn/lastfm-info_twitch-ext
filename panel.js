let lastFmUsername;
let lastFmApiKey;

window.Twitch.ext.onAuthorized(() => {
    loadConfig();
});

window.Twitch.ext.configuration.onChanged(() => {
    loadConfig();
    fetchNowPlaying();
});

function loadConfig() {
    const broadcasterConfig = window.Twitch.ext.configuration.broadcaster;
    if (broadcasterConfig && broadcasterConfig.content) {
        try {
            const configParsed = JSON.parse(broadcasterConfig.content);
            lastFmUsername = configParsed.lastFmUsername;
            lastFmApiKey = configParsed.lastFmApiKey;
        }
        catch (err) {
            console.error(err);
        }
    }
}

function fetchNowPlaying() {
    // Check if lastFmUsername and lastFmApiKey are defined
    if (!lastFmUsername || !lastFmApiKey) {
        console.warn("Last.fm API credentials are undefined. Retrying in 5 seconds...");
        setTimeout(fetchNowPlaying, 5000);
        return;
    }

    const request = new XMLHttpRequest();
    request.open('GET', `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastFmUsername}&api_key=${lastFmApiKey}&format=json&limit=1`);
    request.send();

    request.onload = () => {
        if (request.status === 200) {
            try {
                const recentTracks = JSON.parse(request.response).recenttracks;
                const artist = recentTracks.track[0].artist['#text'];
                const trackname = recentTracks.track[0].name;
                const coverUrl = recentTracks.track[0].image[2]['#text'] || "https://lastfm.freetls.fastly.net/i/u/174s/2a96cbd8b46e442fc41c2b86b821562f.png";
                // ^ mock if cover is empty

                document.getElementById("cover").src = coverUrl;
                document.getElementById('artist').textContent = artist;
                document.getElementById('trackname').textContent = trackname;
            } catch (error) {
                console.error('Error parsing JSON response:', error);
            }
        } else {
            console.error('Error fetching data from Last.fm API:', request.statusText);
        }
    };

    request.onerror = () => {
        console.log('Error occurred while fetching now playing information. Retrying in 10 seconds...');
        setTimeout(fetchNowPlaying, 10000);
    };
}

// update information every 15sec
setInterval(fetchNowPlaying, 15000);