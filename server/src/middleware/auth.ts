import { RequestHandler } from "express";
import createHttpError from "http-errors";

export const requiresAuth: RequestHandler = (req, res, next) => { 
    if (!req.session.userId) {
        throw new createHttpError.Unauthorized("You are not logged in");
    }

    next();
};