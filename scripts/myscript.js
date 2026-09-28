const CLIENT_ID = 'ky1r27xst71xcnslvvpegftytpi48f';

// ---------- Twitch API ----------

function getToken() {
    const params = new URLSearchParams(window.location.hash.replace('#', '?'));
    return params.get('access_token');
}

function twitchGet(url) {
    return $.ajax({
        type: 'GET',
        url: url,
        dataType: 'json',
        headers: {
            'Client-ID': CLIENT_ID,
            'Authorization': 'Bearer ' + getToken(),
        },
    });
}

async function getTwitchID(name) {
    const data = await twitchGet(
        'https://api.twitch.tv/helix/users?login=' + encodeURIComponent(name)
    );
    if (!data.data || data.data.length === 0) {
        throw new Error('Channel "' + name + '" not found');
    }
    return data.data[0].id;
}

// Walks through pages of VODs (100 at a time) until one contains searchTime.
async function findVod(userId, searchTime) {
    let cursor = null;

    while (true) {
        let url = 'https://api.twitch.tv/helix/videos?user_id=' + userId +
                  '&first=100&type=archive';
        if (cursor) url += '&after=' + cursor;

        const page = await twitchGet(url);
        const vods = page.data || [];

        for (const vod of vods) {
            const start = new Date(vod.created_at).getTime();
            const end = start + parseDuration(vod.duration);
            if (searchTime >= start && searchTime <= end) {
                return { vod: vod, offsetMs: searchTime - start };
            }
        }

        // VODs come newest-first, so once the oldest one on the page
        // started before searchTime there's nothing older worth checking.
        const oldest = vods[vods.length - 1];
        const reachedEnd = !page.pagination || !page.pagination.cursor;
        if (!oldest || reachedEnd || new Date(oldest.created_at).getTime() < searchTime) {
            return null;
        }
        cursor = page.pagination.cursor;
    }
}

// ---------- Time helpers ----------

// Twitch durations look like "3h25m10s", "45m10s", "10s", "1h5m" ...
function parseDuration(str) {
    const m = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/.exec(str);
    const h = Number(m[1] || 0);
    const min = Number(m[2] || 0);
    const s = Number(m[3] || 0);
    return (h * 3600 + min * 60 + s) * 1000;
}

function msToTime(ms) {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);       // no % 24, VODs can run past a day
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h + 'h' + m + 'm' + s + 's';
}

// Returns the entered time as epoch milliseconds (NaN if empty/invalid).
function getTime() {
    const dateTime = $('#dateTime').val();
    if (!dateTime) return NaN;

    const mode = $('input[name=group1]:checked', '#timeForm').val();
    console.log('time mode radio value:', mode);

    // Only treat the input as UTC if the UTC option is explicitly selected;
    // anything else (including nothing checked) is local time.
    const isUtc = typeof mode === 'string' && mode.toLowerCase() === 'utc';
    const parsed = isUtc ? moment.utc(dateTime) : moment(dateTime);

    console.log('input:', dateTime, '| treated as:', isUtc ? 'UTC' : 'local',
                '| = UTC', parsed.clone().utc().format());
    return parsed.valueOf();
}

// ---------- UI ----------

$('#submit').click(async function (e) {
    e.preventDefault(); // if the button is in a form, a submit would reload and lose the #access_token

    const channel = $('#twitch').val().trim();
    const searchTime = getTime();

    if (!channel) return alert('Enter a channel name');
    if (isNaN(searchTime)) return alert('Enter a valid date/time');
    if (!getToken()) return alert('Not logged in to Twitch (no access token in URL)');

    // Open the tab now, inside the click, so popup blockers allow it.
    // We point it at the VOD once the async lookups finish.
    const win = window.open('', '_blank');

    try {
        const userId = await getTwitchID(channel);
        const result = await findVod(userId, searchTime);

        if (!result) {
            if (win) win.close();
            return alert('No VOD found for that channel at that time');
        }

        const url = result.vod.url + '?t=' + msToTime(result.offsetMs);
        if (win) win.location.href = url;
        else window.location.href = url;
    } catch (err) {
        if (win) win.close();
        console.error(err);
        alert(err.status === 401
            ? 'Twitch auth failed. Log in again.'
            : (err.message || 'Request failed'));
    }
});
