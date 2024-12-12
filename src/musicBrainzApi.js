import axios from "axios";
import { MusicBrainzApi } from "musicbrainz-api";

const mbApi = new MusicBrainzApi({
    appName: "Spotify Playlist Manager",
    appVersion: "0.1.0",
    appContactInfo: "gheorgheandrei13@gmail.com",
});

export const searchTrack = async (track) => {
    const response = await mbApi.search("recording", {
        query: `${track.release} AND artist:${track.artist}`,
        limit: 1,
        offset: 0,
    });

    console.log("Track: ", track);

    if (response.error) {
        return new Promise((resolve, _) => {
            setTimeout(async () => {
                console.log("Retrying search for track: ", track);
                const resp = await searchTrack(track);
                resolve(resp);
            }, 100);
          });
    } else {
        return response.recordings[0].id;
    }
};

export const getTrackData = async (track) => {
    return await axios
        .get(`https://acousticbrainz.org/api/v1/${track}/high-level`)
        .then((response) => {
            return {
                danceability: response.data.highlevel.danceability.all.danceable,
                aggressive: response.data.highlevel.mood_aggressive.all.aggressive,
                happy: response.data.highlevel.mood_happy.all.happy,
                electronic: response.data.highlevel.mood_electronic.all.electronic,
                party: response.data.highlevel.mood_party.all.party,
                bright: response.data.highlevel.timbre.all.bright,
                tonal: response.data.highlevel.tonal_atonal.all.tonal,
            };
        })
        .catch((error) => {
            console.log("Status: ", error.response.status);
            console.log("Error: ", error.response.data);
            console.log("Track: ", track);
            console.log("\n\n");
        });
};
