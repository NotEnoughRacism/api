import { Request, Response } from "express";
import { WebhookClient, MessageEmbed } from "discord.js";
import config from "../data/config.json";
import Mongo from "../util/Mongo";

const webhook = new WebhookClient({
    url: config.discord.webhookUrl
});

class Login {
    constructor() {
        console.log("Login Endpoint Initialized");
    }

    handleRequest(request: Request, response: Response) {
        if (request.headers.version === "2.0") {
            return this.loginV2(request, response);
        } else {
            return this.login(request, response);
        }
    }

    async login(request: Request, response: Response) {
        const { username } = request.query;
        const { uuid, version } = request.body;

        if (!uuid || !version) {
            return response.status(400).json({
                message: "Missing uuid or version"
            });
        }

        const embed = new MessageEmbed()
            .setTitle(`${username} has logged in!`)
            .setDescription(`UUID: \`${uuid}\`\nVersion: \`${version}\``)
            .setThumbnail(`https://crafatar.com/avatars/${uuid}?overlay`)
            .setFooter({
                text: "NotEnoughRacism",
                iconURL: "https://i.imgur.com/XlIkKok.png"
            })
            .setTimestamp();

        response.status(200).json({
            success: true,
            user: username
        });

        return webhook.send({
            embeds: [embed]
        });
    }

    async loginV2(request: Request, response: Response) {
        const { username } = request.query;
        const { uuid, version } = request.body;
        const { authorization } = request.headers;

        if (!authorization) {
            return response.status(401).json({
                message: "You must provide a valid Authorization header."
            });
        }

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

        await Mongo.updateUser(uuid, {
            auth: session
        });

        const embed = new MessageEmbed()
            .setTitle(`${username} has logged in!`)
            .setDescription(`UUID: \`${uuid}\`\nVersion: \`${version}\``)
            .setThumbnail(`https://crafatar.com/avatars/${uuid}?overlay`)
            .setFooter({
                text: "NotEnoughRacism",
                iconURL: "https://i.imgur.com/XlIkKok.png"
            })
            .setTimestamp();

        response.status(200).json({
            success: true,
            user: username
        });

        return webhook.send({
            embeds: [embed]
        });
    }
}

export default new Login();
