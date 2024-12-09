import express from 'express';
import axios from 'axios';
import querystring from 'querystring';
import crypto from 'crypto';
import cookieparser from 'cookie-parser';
import { MusicBrainzApi } from 'musicbrainz-api';
import 'dotenv/config';

const mbApi = new MusicBrainzApi({
    appName: 'Spotify Playlist Manager',
    appVersion: '0.1.0',
    appContactInfo: 'gheorgheandrei13@gmail.com',
});

const app = express();
const port = 3000;
app.use(express.json())
    .use(cookieparser())
    .use(express.static('public'));

app.get('/login', function (_, res) {
    const state = crypto.randomBytes(16).toString('hex');
    const scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative';

    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: process.env.CLIENT_ID,
            scope: scope,
            redirect_uri: process.env.REDIRECT_URI,
            state: state
        }));
});

app.get('/callback', function (req, res) {
    const code = req.query.code || null;
    const state = req.query.state || null;

    if (state === null) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        axios.post('https://accounts.spotify.com/api/token', {
            code: code,
            redirect_uri: process.env.REDIRECT_URI,
            grant_type: 'authorization_code'
        }, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + (new Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64'))
            }
        }).then((response) => {
            res.cookie('access_token', response.data.access_token);
            res.cookie('refresh_token', response.data.refresh_token);
            res.redirect('/');
        }).catch((error) => {
            console.log(error);
        });
    }
});

app.get('/refresh_token', function (req, res) {
    const refresh_token = req.query.refresh_token;
    axios.post('https://accounts.spotify.com/api/token', {
        refresh_token: refresh_token,
        grant_type: 'refresh_token'
    }, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (new Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64'))
        }
    }).then((response) => {
        res.cookie('access_token', response.data.access_token);
        res.cookie('refresh_token', response.data.refresh_token);
        res.redirect('/');
    }).catch((error) => {
        console.log(error);
    });
});

app.get('/playlists', function (req, res) {
    const access_token = req.cookies.access_token;
    axios.get('https://api.spotify.com/v1/me/playlists', {
        headers: {
            'Authorization': 'Bearer ' + access_token
        }
    }).then((response) => {
        res.json(response.data);
    }).catch((error) => {
        console.log(error);
    });
});

app.get('/playlist/:id', function (req, res) {
    const access_token = req.cookies.access_token;
    axios.get(`https://api.spotify.com/v1/playlists/${req.params.id}/tracks`, {
        headers: {
            'Authorization': 'Bearer ' + access_token
        }
    }).then((response) => {
        const tracks = response.data.items.map((item) => {
            return {
                release: item.track.name,
                artist: item.track.artists[0].name
            };
        });

        for (const track of tracks) {
            mbApi.search('recording', {
                query: `${track.release} AND artist:${track.artist}`,
                limit: 1,
                offset: 0
            }).then((response) => {
                if (response.error) {
                    console.log(response.error);
                    return;
                } else {
                    console.log(`${track.release} - ${track.artist}`);
                    console.log(response.recordings[0].id);
                }
            });
        }

        res.json(response.data);
    }).catch((error) => {
        console.log(error);
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});