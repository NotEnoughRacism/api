import { Db, MongoClient, MongoError, ObjectId } from "mongodb";
import config from "../data/config.json";

export interface MongoUser {
    _id: ObjectId;
    uuid: string;
    spotify?: {
        refreshToken: string;
        accessToken: string;
        expiryDate: number;
    };
}

export interface MinecraftUser {
    username: string;
    session: string;
}

class Mongo {
    mongo: Db | null;

    constructor() {
        this.mongo = null;
    }

    connect() {
        return MongoClient.connect(config.mongo.url)
            .then((client) => {
                this.mongo = client.db(config.mongo.db);
                console.log(`Connected to Database ${this.mongo.databaseName}`);
            })
            .catch((error: MongoError) => {
                console.error(`Failed to connect to MongoDB: ${error.stack}`);
            });
    }

    getMinecraftUser(username: string) {
        return this.mongo?.collection("minecraftUsers").findOne({ username: username });
    }

    getUser(uuid: string) {
        return this.mongo?.collection("users").findOne({ uuid: uuid });
    }

    addUser(uuid: string) {
        return this.mongo?.collection("users").insertOne({ uuid: uuid });
    }

    updateUser(uuid: string, update: any) {
        return this.mongo?.collection("users").updateOne({ uuid: uuid }, { $set: update });
    }
}

export default new Mongo();
