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
  let listCnt = 0;
  await items.forEach(async (item) => {
    console.log(item.snippet.title);
    listCnt++;
  });
  console.log("length:-", items.length);
  console.log("Count:- ", listCnt);
  res.send(items[0]);
});

server.listen(PORT, () => {
  console.log(`Server is listening at http://localhost:${PORT}`);
});
