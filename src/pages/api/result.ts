import { NextApiRequest, NextApiResponse } from "next";
import fs from 'fs';
import OpenAI from 'openai';
import { execSync } from 'node:child_process';
import path from 'path';
import logger from "@/utils/logger";

const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
});

interface ChatLog {
    role: string;
    content: string;
}

export const config = {
    api: {
        responseLimit: false,
        bodyParser: {
            sizeLimit: '100mb',
        },
    },
    maxDuration: 20,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = req.body.user;

    // Ensure environment variable is used correctly for Python path
    const pythonPath = process.env.PYTHON_PATH;
    if (!pythonPath) {
        console.error("Python path is not defined in environment variables.");
        res.status(500).json({ error: 'Python path is not set in the environment.' });
        return;
    }

    // Resolve the script path using path.join and __dirname
    const scriptPath = path.join(__dirname, '..', '..', 'src', 'child_processes', 'evaluation.py');
    const command = `${pythonPath} ${scriptPath} --user ${user}`;

    let result = [];
    try {
        // Execute the Python script and capture stdout
        const stdout = execSync(command, { encoding: 'utf-8' });
        result = JSON.parse(stdout.trim());

        // Format the result to two decimal places for number values
        for (const key in result) {
            if (typeof result[key] === 'number') {
                result[key] = Number(result[key].toFixed(2));
            }
        }
        console.log("result: ", result);

        // Send the result back as a response
        res.status(200).json(result);
    } catch (error: unknown) {
        // Log the detailed error for debugging
        console.error(`Error executing Python script: ${error}`);
        logger.error(`Error executing Python script: ${error}`);

        // Send a 500 error response with a user-friendly message
        res.status(500).json({ error: 'Error getting results, please try again.' });
    }
}
