import axios from 'axios';
import { MusicBrainzApi } from 'musicbrainz-api';

const mbApi = new MusicBrainzApi({
    appName: 'Spotify Playlist Manager',
    appVersion: '0.1.0',
    appContactInfo: 'gheorgheandrei13@gmail.com',
});

export const searchTrack = async (track) => {
    const response = await mbApi.search('recording', {
        query: `${track.release} AND artist:${track.artist}`,
        limit: 1,
        offset: 0
    });

    if (response.error) {
        // Wait for a second and try again
        console.log(response.error);
        return setTimeout(async () => {
            return await searchTrack(track);
        }, 1000);
    } else {
        console.log(response);
        console.log(`${track.release} - ${track.artist}`);
        console.log(response.recordings[0].id);
        return response.recordings[0].id;
    }
}

export const getTrackData = async (track) => {
    const response = await axios.get(`https://api.acousticbrainz.org/v1/${track}/high-level`);
    return response.data;
}