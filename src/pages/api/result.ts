import { NextApiRequest, NextApiResponse } from "next";
import fs from 'fs';
import OpenAI from 'openai';
import { execSync } from 'node:child_process';

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
    const user = "susan2_250724-1721886125576";
    const ori_user = req.body.user;
    
    console.log("user: ", user, "ori_user: ", ori_user);

    const scriptPath = "src\\child_processes\\evaluation.py";
    const pythonPath = process.env.NEXT_PUBLIC_PYTHON_PATH
    const command = `${pythonPath} ${scriptPath} --user ${user}`;

    let result = [];
    try {
        const stdout = execSync(command, { encoding: 'utf-8' });
        result = JSON.parse(stdout.trim());
        console.log("result: ", result);
    } catch (error: unknown) {
        console.error(`Error executing command: ${error}`);
        res.status(500).json({ error: 'Error getting results, please try again' });
        return;
    }
    res.status(200).json(result);
}
