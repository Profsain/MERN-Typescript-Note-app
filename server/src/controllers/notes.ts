import { RequestHandler } from "express";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import NoteModel from "../models/note";
import { assertIsDefined } from "../utils/assertionsDefined";

// GET /notes - Get all notes
export const getNotes: RequestHandler = async (req, res, next) => { 
    const authenticatedUserId = req.session.userId;

    try {
        assertIsDefined(authenticatedUserId);

        const notes = await NoteModel.find({ userId: authenticatedUserId }).exec();
        res.status(200).json(notes);
    } catch (error) {
        next(error);
    }
};

// get single note
export const getNote: RequestHandler = async (req, res, next) => { 
    const noteId = req.params.noteId;
    const authenticatedUserId = req.session.userId;

    try {
        assertIsDefined(authenticatedUserId);

        if (!mongoose.isValidObjectId(noteId)) {
            throw new createHttpError.BadRequest("Invalid note id");
        }

        const note = await NoteModel.findOne(noteId).exec();

        if (!note?.userId.equals(authenticatedUserId)) {
            throw new createHttpError.Forbidden("You are not allowed to access this note");
        }

        res.status(200).json(note);
    } catch (error) {
        next(error);
    }
};

// POST /notes - Create a new note
export const createNote: RequestHandler<unknown, unknown, CreateNoteBody, unknown> = async (req, res, next) => {
    const title = req.body.title;
    const text = req.body.text;
    const authenticatedUserId = req.session.userId;

    try {
        assertIsDefined(authenticatedUserId);

        if (!title) {
            throw new createHttpError.BadRequest("Title is required");
        }

        const newNote = await NoteModel.create({
            title,
            text,
            userId: authenticatedUserId,
        });

        res.status(201).json(newNote);
    } catch (error) {
        next(error);
    }
};

interface UpdateNoteParams {
    noteId: string;
}

interface UpdateNoteBody {
    title?: string;
    text?: string;
}

// PUT /notes/:noteId - Update a note
export const updateNote: RequestHandler<UpdateNoteParams, unknown, UpdateNoteBody, unknown> = async (req, res, next) => { 
    const noteId = req.params.noteId;
    const newTitle = req.body.title;
    const newText = req.body.text;
    const authenticatedUserId = req.session.userId;

    try {
        assertIsDefined(authenticatedUserId);

        if (!mongoose.isValidObjectId(noteId)) {
            throw new createHttpError.BadRequest("Invalid note id");
        }

        const note = await NoteModel.findOne(noteId).exec();

        if (!note?.userId.equals(authenticatedUserId)) {
            throw new createHttpError.Forbidden("You are not allowed to access this note");
        }

        if (!newTitle) {
            throw new createHttpError.BadRequest("Title is required");
        }

        if (!note.userId.equals(authenticatedUserId)) {
            throw new createHttpError.Forbidden("You are not allowed to access this note");
        }

        note.title = newTitle;
        note.text = newText;
        await note.save();

        res.status(200).json(note);
    } catch (error) {
        next(error);
    }
};


// DELETE /notes/:noteId - Delete a note
export const deleteNote: RequestHandler = async (req, res, next) => {
    const noteId = req.params.noteId;
    const authenticatedUserId = req.session.userId;

    try {
        assertIsDefined(authenticatedUserId);

        if (!mongoose.isValidObjectId(noteId)) {
            throw new createHttpError.BadRequest("Invalid note id");
        }

        const note = await NoteModel.findOne(noteId).exec();

        if (!note?.userId.equals(authenticatedUserId)) {
            throw new createHttpError.Forbidden("You are not allowed to access this note");
        }

        if (!note) {
            throw new createHttpError.NotFound("Note not found");
        }

        if (!note.userId.equals(authenticatedUserId)) {
            throw new createHttpError.Forbidden("You are not allowed to access this note");
        }

        await note.delete();

        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
}