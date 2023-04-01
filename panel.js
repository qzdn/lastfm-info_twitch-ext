let lastFmUsername;
let lastFmApiKey;
const MOCK_COVER = 'https://picsum.photos/id/117/200'

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
        catch (err) {
            console.error(err);
        }
    }
}

// sometimes lastfm gives 404 on img, so we replace that img with the mock
function replace404IMGtoMock() {
  document.getElementById('cover').src = 'https://picsum.photos/id/117/200';
}

function fetchScrobblingNow() {
    // Check if lastFmUsername and lastFmApiKey are defined
    if (!lastFmUsername || !lastFmApiKey) {
        console.warn('Last.fm API credentials are undefined. Retrying in 5 seconds...');
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
                const coverUrl = recentTracks.track[0].image[2]['#text'] || MOCK_COVER; // mock if cover is empty
                const trackname = recentTracks.track[0].name;  
                const artist = recentTracks.track[0].artist['#text'];   
                
                if (recentTracks.track[0].hasOwnProperty('@attr')) // check if track is scrobbling rn or scrobbled before
                {          
                    document.getElementById('cover').src = coverUrl;
                    document.getElementById('trackname').textContent = trackname;
                    document.getElementById('artist').textContent = `by ${artist}`;
                } else {
                    document.getElementById('cover').src = coverUrl; // cover of last scrobbled track
                    document.getElementById('trackname').textContent = 'nothing';
                    document.getElementById('artist').textContent = '';
                }
                document.getElementById('cover').addEventListener('error', replace404IMGtoMock); // if 404 or something else
            } catch (error) {
                console.error('Error parsing JSON response: ', error);
            }
        } else {
            console.error('Error fetching data from Last.fm API: ', request.statusText);
        }
    };

    request.onerror = () => {
        console.log('Error occurred while fetching now playing information. Retrying in 10 seconds...');
        setTimeout(fetchScrobblingNow, 10000);
    };
}

// update information every 15sec
setInterval(fetchScrobblingNow, 15000);