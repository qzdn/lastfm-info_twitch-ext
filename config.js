let lastFmUsername;
let lastFmApiKey;

window.Twitch.ext.onAuthorized(() => {
    const config = window.Twitch.ext.configuration.broadcaster ? JSON.parse(window.Twitch.ext.configuration.broadcaster.content) : {};
    lastFmUsername = config.lastFmUsername;
    lastFmApiKey = config.lastFmApiKey;
    document.getElementById('lastfm-username').value = lastFmUsername;
    document.getElementById('lastfm-apikey').value = lastFmApiKey;
});

document.getElementById('config-form').addEventListener('submit', event => {
    event.preventDefault();
    const username = document.getElementById('lastfm-username').value;
    const apiKey = document.getElementById('lastfm-apikey').value;
    const messageElement = document.getElementById('message');
    try {
        window.Twitch.ext.configuration.set('broadcaster', 'qnsoh1zafcgcs0515my36c9kd6tdiq-v0.3.1', JSON.stringify({ lastFmUsername: username, lastFmApiKey: apiKey }));
        messageElement.textContent = 'Configuration saved successfully';
        messageElement.classList.remove('hidden', 'fail');
        messageElement.classList.add('success');
    }
    catch (err) {
        console.error(err);
        messageElement.textContent = 'Error saving configuration';
        messageElement.classList.remove('hidden', 'success');
        messageElement.classList.add('fail');
    }
});