import http from "http";
import express from "express";

import dotenv from "dotenv";
const app = express();
const server = http.createServer(app);
const PORT = 5003;
import { google } from "googleapis";

// Calling dotenv.config()
dotenv.config();

const apikey = process.env.API_KEY;

//FUNCTION TO FORMAT THE DURATION
function formatTime(seconds) {
  // Calculate hours, minutes, and seconds
  let hours = Math.floor(seconds / 3600);
  let minutes = Math.floor((seconds % 3600) / 60);
  let remainingSeconds = seconds % 60;

  // Initialize an empty array to store the time components
  let timeComponents = [];

  // Add hours, minutes, and seconds to the array if they are not zero
  if (hours > 0) {
    timeComponents.push(hours < 10 ? `0${hours}` : hours);
  }
  if (minutes > 0 || hours > 0) {
    timeComponents.push(minutes < 10 ? `0${minutes}` : minutes);
  }
  timeComponents.push(
    remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds
  );

  // Join the time components with colons
  return timeComponents.join(":");
}

//FUNCTION TO GET VIDEO DETAILS
const getVideoLength = async (apiKey, videoId) => {
  const youtube = google.youtube({
    version: "v3",
    auth: apiKey,
  });

  try {
    const response = await youtube.videos.list({
      part: "contentDetails",
      id: videoId,
    });
    const duration = response.data.items[0].contentDetails.duration;

    //Converting the duration
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(\d+)S/);
    const hours = parseInt(match[1] || 0, 10);
    const minutes = parseInt(match[2] || 0, 10);
    const seconds = parseInt(match[3], 10);
    const parsedMinutes = hours * 60 + minutes;
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
  const pId = req.query.pId;

  const items = await listPlaylistItems(apikey, pId);
  console.log("ITEMS LIST STARTS HERE:-");

  // Create an array of promises for video length retrievals
  const videoLengthPromises = items.map(async (item) => {
    const vId = item.snippet.resourceId.videoId;
    return await getVideoLength(apikey, vId);
  });
  //console.log("total", totalLen);

  // Wait for all video length promises to resolve
  const videoLengths = await Promise.all(videoLengthPromises);

  //Calculate the total duration
  let totalSec = 0;
  for (let i = 0; i < videoLengths.length; i++) {
    console.log("Length of video " + i + " " + videoLengths[i]);
    totalSec += videoLengths[i];
  }
  const formatedLength = formatTime(totalSec);

  console.log("length:-", items.length);

  console.log("Duration", formatedLength);

  // Send the response with the items and total duration
  res.send({ items, totalSec });
});

server.listen(PORT, () => {
  console.log(`Server is listening at http://localhost:${PORT}`);
});
