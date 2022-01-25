import { NextFunction, Request, Response } from "express";

class GoodMorning {
    constructor() {
        console.log("Good Morning Endpoint Initialized");
    }

    handleRequest(request: Request, response: Response, next: NextFunction) {
        if (request.headers.version === "2.0") {
            return this.goodMorningV2(request, response);
        } else {
            return this.goodMorning(request, response);
        }
    }

    goodMorning(request: Request, response: Response) {
        return response.status(200).json({
            message: "Good Morning"
        });
    }

    goodMorningV2(request: Request, response: Response) {
        return response.status(200).json({
            message: "Bad Morning"
        });
    }
}

export default new GoodMorning();
