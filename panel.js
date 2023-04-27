let lastFmUsername;
let lastFmApiKey;

const LASTFM_BASE_URI = 'https://ws.audioscrobbler.com/2.0/';
const MOCK_COVER = 'https://picsum.photos/id/117/200';

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
        }
        catch (error) {
            console.error(error);
        }
    }
}

// sometimes lastfm gives 404 on img, so we replace that img with the mock
function replace404IMGtoMock() {
    document.getElementById('cover').src = MOCK_COVER;
}

function updateTrackInfo(coverUrl, trackname, artist) {
    const coverElement = document.getElementById('cover');
    const tracknameElement = document.getElementById('trackname');
    const artistElement = document.getElementById('artist');

    coverElement.src = coverUrl;
    tracknameElement.textContent = trackname;
    artistElement.textContent = artist;

    coverElement.addEventListener('error', replace404IMGtoMock); // if 404 or something else
}

function fetchScrobblingNow() {
    // Check if lastFmUsername and lastFmApiKey are defined
    if (!lastFmUsername || !lastFmApiKey) {
        console.warn('Last.fm API credentials are undefined. Retrying in 10 seconds...');
        setTimeout(fetchScrobblingNow, 10 * 1000);
        return;
    }

    const request = new XMLHttpRequest();
    request.open('GET', `${LASTFM_BASE_URI}?method=user.getrecenttracks&user=${lastFmUsername}&api_key=${lastFmApiKey}&extended=1&format=json&limit=1`);
    request.send();

    request.onload = () => {
        if (request.status === 200) {
            try {
                const recentTrack = JSON.parse(request.response).recenttracks.track[0];
                const coverUrl = recentTrack.image[2]['#text'] || MOCK_COVER; // mock if cover is empty
                const trackname = (recentTrack.loved === "1") ? `❤️ ${recentTrack.name}` : recentTrack.name;
                const artist = recentTrack.artist['name'];
                (recentTrack?.['@attr']?.nowplaying) ? updateTrackInfo(coverUrl, trackname, `by ${artist}`) : updateTrackInfo(coverUrl, 'nothing', '');
            } catch (error) {
                console.error('Error parsing JSON response: ', error);
            }
        } else {
            console.error('Error fetching data from Last.fm API: ', request.statusText);
        }
    };

    request.onerror = () => {
        console.error('Error occurred while fetching info from Last.fm. Retrying in 10 seconds...');
        setTimeout(fetchScrobblingNow, 10 * 1000);
    };
}

setInterval(fetchScrobblingNow, 15 * 1000);