import { RequestHandler } from "express";
import createHttpError from "http-errors";
import UserModel from "../models/user";
import bcrypt from "bcrypt";

export const getAuthenticatedUser: RequestHandler = async (req, res, next) => { 
    try {
        const user = await UserModel.findById(req.session.userId).select("+email").exec();
    } catch (error) {
        next(error);
    }
};

interface SignupBody { 
    username: string;
    email?: string;
    password: string;
};

export const signup: RequestHandler<unknown, unknown, SignupBody, unknown> = async (req, res, next) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    try {
        if (!username) {
            throw new createHttpError.BadRequest("Username is required");
        }

        if (!password) {
            throw new createHttpError.BadRequest("Password is required");
        }

        const existingUsername = await UserModel.findOne({ username: username }).exec();

        if (existingUsername) {
            throw new createHttpError.Conflict("Username already exists, login instead");
        }

        const existingEmail = await UserModel.findOne({ email: email }).exec();

        if (existingEmail) {
            throw new createHttpError.Conflict("Email already exists, login instead");
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await UserModel.create({
            username,
            email,
            password: hashedPassword,
        });

        req.session.userId = newUser._id;

        res.status(201).json(newUser);
    } catch (error) {
        next(error);
    }
};


interface LoginBody {
    username: string;
    password: string;
};

export const login: RequestHandler<unknown, unknown, LoginBody, unknown> = async (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    try {
        if (!username) {
            throw new createHttpError.BadRequest("Username is required");
        }

        if (!password) {
            throw new createHttpError.BadRequest("Password is required");
        }

        const user = await UserModel.findOne({ username: username }).exec();

        if (!user) {
            throw new createHttpError.NotFound("User not found/Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new createHttpError.Unauthorized("Invalid password");
        }

        req.session.userId = user._id;

        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

// logout
export const logout: RequestHandler = async (req, res, next) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                next(err);
            }
        });

        res.clearCookie(process.env.SESSION_NAME!);

        res.status(200).json({ message: "Logged out" });
    } catch (error) {
        next(error);
    }
}