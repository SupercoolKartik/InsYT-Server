import http from "http";
import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";

const app = express();
const server = http.createServer(app);
const PORT = 5003;

// Calling dotenv.config()
dotenv.config();

const apikey = process.env.API_KEY;

//FUNCTION TO GET THE PLAYLIST NAME
const getPlaylistTitle = async (auth, playlistId) => {
  const youtube = google.youtube({
    version: "v3",
    auth,
  });

  // Define the request parameters
  const request_parameters = {
    part: "snippet",
    id: playlistId,
  };
  try {
    const response = await youtube.playlists.list(request_parameters);
    //const response = await youtube.playlists().list(playlistId).execute();
    return await response.data.items[0].snippet.title;
  } catch (err) {
    console.error(err);
  }
};

//FUNCTION TO GET VIDEO DETAILS
const getVideoLength = async (auth, videoId) => {
  const youtube = google.youtube({
    version: "v3",
    auth,
  });

  try {
    const response = await youtube.videos.list({
      part: "contentDetails",
      id: videoId,
    });
    const duration = response.data.items[0].contentDetails.duration; //Duration of Video(of a particular video)

    //Converting the duration
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(\d+)S/);
    const hours = parseInt(match[1] || 0, 10);
    const minutes = parseInt(match[2] || 0, 10);
    const seconds = parseInt(match[3], 10);

    const parsedSec = hours * 60 * 60 + minutes * 60 + seconds;
    return parsedSec;
  } catch (error) {
    console.error("Error fetching video length:", error);
  }
};

//FUNCTION TO GET PLAYLIST ITEMS DETAILS
const listPlaylistItems = async (auth, playlistId) => {
  const youtube = google.youtube({
    version: "v3",
    auth,
  });

  try {
    const response = await youtube.playlistItems.list({
      part: "snippet",
      playlistId,
      maxResults: 50,
    });

    // Extract and return the items array directly
    return response.data.items;
  } catch (err) {
    console.error(err);
  }
};

app.get("/", async (req, res) => {
  const pId = req.query.pId; //Playlist Id

  const items = await listPlaylistItems(apikey, pId); //List of Playlist items

  // Create an array of promises for video length retrievals
  const videoLengthPromises = items.map(async (item) => {
    const vId = item.snippet.resourceId.videoId; //Video Id(of a particular video in the playlist)
    return await getVideoLength(apikey, vId);
  });
  // Wait for all video length promises to resolve
  const videoLengths = await Promise.all(videoLengthPromises);
  //Calculate the total duration
  let playlist_length = 0; //(in seconds)
  for (let i = 0; i < videoLengths.length; i++) {
    playlist_length += videoLengths[i];
  }

  const playlist_size = items.length;
  const playlist_name = await getPlaylistTitle(apikey, pId);

  // Send the response with the items and total duration
  res.json({ playlist_name, playlist_size, playlist_length });
});

server.listen(PORT, () => {
  console.log(`Server is listening at http://localhost:${PORT}`);
});
