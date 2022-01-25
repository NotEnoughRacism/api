import { Request, Response } from "express";
import SessionManager, { Session } from "../util/SessionManager";
import config from "../data/config.json";
import querystring from "querystring";
import Mongo from "../util/Mongo";
import axios from "axios";

class Spotify {
    constructor() {
        console.log("Spotify Endpoint Initialized");
    }

    handleLogin(request: Request, response: Response) {
        return this.login(request, response);
    }

    handleCallback(request: Request, response: Response) {
        return this.callback(request, response);
    }

    handleSession(request: Request, response: Response) {
        return this.session(request, response);
    }

    async login(request: Request, response: Response) {
        const { username } = request.query;
        if (!username) {
            response.status(400).send("Missing username");
            return;
        }
        const uuid = await axios
            .get(`https://api.mojang.com/users/profiles/minecraft/${username}`)
            .then((r) => r.data.id)
            .catch((e) => null);
        if (!uuid) return response.status(400).send("Invalid username");

        const session: Session = {
            state: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            expires: Date.now() + SessionManager.sessionLifetime,
            uuid: uuid
        };

        SessionManager.create(session);
        request.session.state = session.state;

        const SpotifyURL =
            "https://accounts.spotify.com/authorize?" +
            querystring.stringify({
                response_type: "code",
                client_id: config.spotify.clientId,
                scope: config.spotify.scopes,
                redirect_uri: config.spotify.redirectUri,
                state: session.state
            });
        return response.redirect(SpotifyURL);
    }

    async callback(request: Request, response: Response) {
        const { state } = request.query;

        if (request.session.state !== state || state == undefined) {
            return response.status(400).send("Invalid state");
        }

        if (request.query.error) {
            return response.status(400).send("Error: " + request.query.error);
        }

        const session = SessionManager.get(state);

        if (!session) {
            return response.status(400).send("Session expired");
        }

        const code = request.query.code as any;

        if (!code) {
            return response.status(400).send("Invalid redirect");
        }

        const spotifyRes = await axios
            .post(
                "https://accounts.spotify.com/api/token",
                querystring.stringify({
                    grant_type: "authorization_code",
                    code: code,
                    redirect_uri: config.spotify.redirectUri
                }),
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Authorization: "Basic " + Buffer.from(config.spotify.clientId + ":" + config.spotify.clientSecret).toString("base64")
                    }
                }
            )
            .then((r) => r.data)
            .catch((e) => null);

        if (!spotifyRes) return response.status(400).send("Error connecting to Spotify");

        const { access_token, refresh_token, expires_in } = spotifyRes;

        if (!access_token || !refresh_token || !expires_in) return response.status(400).send("Error connecting to Spotify");

        const user = await Mongo.getUser(session.uuid);

        if (!user) await Mongo.addUser(session.uuid);

        await Mongo.updateUser(session.uuid, {
            spotify: {
                accessToken: access_token,
                refreshToken: refresh_token,
                expiryDate: Date.now() + expires_in * 1000
            }
        });

        return response.status(200).send("Successfully connected to Spotify");
    }

    async session(request: Request, response: Response) {
        const { username } = request.query;

        if (!username) {
            return response.status(400).json({
                message: "Missing username"
            });
        }

        const uuid = await axios
            .get(`https://api.mojang.com/users/profiles/minecraft/${username}`)
            .then((r) => r.data.id)
            .catch((e) => null);
        if (!uuid)
            return response.status(400).json({
                message: "Invalid username"
            });

        let user = await Mongo.getUser(uuid);
        if (!user) {
            await Mongo.addUser(uuid);
            user = await Mongo.getUser(uuid);
        }

        if (!user?.spotify)
            return response.status(400).json({
                message: "User not connected to Spotify"
            });

        const { accessToken, refreshToken, expiryDate } = user.spotify;

        if (Date.now() > expiryDate) {
            const spotifyRes = await axios
                .post(
                    "https://accounts.spotify.com/api/token",
                    querystring.stringify({
                        grant_type: "refresh_token",
                        refresh_token: refreshToken
                    }),
                    {
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                            Authorization: "Basic " + Buffer.from(config.spotify.clientId + ":" + config.spotify.clientSecret).toString("base64")
                        }
                    }
                )
                .then((r) => r.data)
                .catch((e) => null);

            if (!spotifyRes)
                return response.status(400).json({
                    message: "Error connecting to Spotify"
                });

            await Mongo.updateUser(uuid, {
                spotify: {
                    accessToken: {
                        token: spotifyRes.access_token,
                        expiryDate: Date.now() + spotifyRes.expires_in * 1000
                    }
                }
            });
            return response.status(200).json({
                accessToken: spotifyRes.access_token,
                expiryDate: Date.now() + spotifyRes.expires_in * 1000
            });
        }

        return response.status(200).json({
            accessToken: accessToken,
            expiryDate: expiryDate
        });
    }
}

export default new Spotify();
