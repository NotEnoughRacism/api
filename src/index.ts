import express from "express";
import session from "express-session";
import config from "./data/config.json";
import GoodMorning from "./endpoints/GoodMorning";
import Login from "./endpoints/Login";
import { mojangAuth, sessionAuth } from "./util/Auth";
import Spotify from "./endpoints/Spotify";

const app = express();
const router = express.Router();

app.get("/goodmorning", GoodMorning.handleRequest);
app.post("/login", mojangAuth, Login.handleRequest);
app.get("/spotify/login", sessionAuth, Spotify.handleLogin);
app.get("/spotify/callback", Spotify.handleCallback);
app.get("/spotify/session", sessionAuth, Spotify.handleSession);

app.use(express.json(), express.urlencoded({ extended: false }));
app.use(
    session({
        secret: config.express.session.secret,
        resave: false,
        saveUninitialized: false
    })
);
app.use("/", router);
app.set("json spaces", 2);

app.listen(config.express.port, () => {
    console.log(`Server is listening on port ${config.express.port}`);
});
