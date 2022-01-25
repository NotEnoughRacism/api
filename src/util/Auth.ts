import { NextFunction, Request, Response } from "express";
import axios from "axios";
import Mongo from "./Mongo";

export async function mojangAuth(request: Request, response: Response, next: NextFunction) {
    const { username, serverId } = request.query;

    if (!username || !serverId) {
        return response.status(400).json({
            message: "Missing username or serverId"
        });
    }

    let mojangRes = await axios.get("https://sessionserver.mojang.com/session/minecraft/hasJoined?username=" + username + "&serverId=" + serverId);

    if (!mojangRes.data?.id) {
        return response.status(401).json({
            message: "Failed to authenticate with mojang"
        });
    }

    next();
}

export async function sessionAuth(request: Request, response: Response, next: NextFunction) {
    let authorization = request.headers.authorization ?? request.query.authorization;
    const { username } = request.query;

    if (!username) {
        return response.status(400).json({
            message: "Missing username"
        });
    }

    if (Array.isArray(username)) {
        return response.status(400).json({
            message: "Username must be a string"
        });
    }

    if (!authorization) {
        return response.status(401).json({
            message: "You must provide a valid Authorization header."
        });
    }

    if (Array.isArray(authorization)) {
        return response.status(401).json({
            message: "You must provide a valid Authorization header."
        });
    }

    authorization = authorization.toString();

    if (authorization.split(" ")[0] !== "Session") {
        return response.status(401).json({
            message: "You must provide a valid Authorization header."
        });
    }

    if (!authorization.split(" ")[1]) {
        return response.status(401).json({
            message: "You must provide a valid Authorization header."
        });
    }

    const session = authorization.split(" ")[1];

    const user = await Mongo.getMinecraftUser(username.toString());

    if (user?.session !== session) {
        return response.status(401).json({
            message: "You must provide a valid Authorization header."
        });
    }

    next();
}
