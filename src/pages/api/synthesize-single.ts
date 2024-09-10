import logger from "@/utils/logger";
import { NextApiRequest, NextApiResponse } from "next";
const textToSpeech = require('@google-cloud/text-to-speech');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');
const util = require('util');
const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

export const config = {
    api: {
        responseLimit: false,
        bodyParser: {
            sizeLimit: '100mb',
        },
    },
    maxDuration: 20,
};

export default function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const TTS = async () => {
        await authenticateImplicitWithAdc().then(async () => {
            const client = new textToSpeech.TextToSpeechClient();

            const { text, audio, user, chatLogs, answer, isInit } = req.body;

            // Safe base64 wav file to disk
            const base64Data = audio.replace(/^data:audio\/wav;base64,/, '');
            const currentDate = new Date().getTime();

            const recordsDir = path.join(__dirname, '..', '..', 'public', 'audio', 'records');
            const userDir = path.join(recordsDir, user);

            if (!fs.existsSync(recordsDir)) {
                fs.mkdirSync(recordsDir, { recursive: true });
            }

            if (!fs.existsSync(userDir)) {
                fs.mkdirSync(userDir, { recursive: true });
            }

            const userAudioDir = path.join(userDir, 'user');
            if (!fs.existsSync(userAudioDir)) {
                fs.mkdirSync(userAudioDir, { recursive: true });
            }

            if (!isInit) {
                const fileName = path.join(userAudioDir, `${currentDate}.wav`);
                console.log("User audio path", fileName);
                fs.writeFileSync(fileName, base64Data, 'base64');
            }

            // Write chat logs to file txt
            const chatLogsPath = path.join(userDir, 'chatLogs.txt');
            fs.writeFileSync(chatLogsPath, JSON.stringify([...chatLogs, { role: "user", content: answer }, { role: "assistant", content: text }], null, 2));

            const writeFile = util.promisify(fs.writeFile);

            const request = {
                input: { text: text },
                voice: { languageCode: 'en-GB', name: 'en-GB-Wavenet-A' },
                audioConfig: {
                    "audioEncoding": "MP3",
                    "effectsProfileId": [
                        "headphone-class-device"
                    ],
                    "pitch": 1.20,
                    "speakingRate": 0.9
                },
            };
            const [response] = await client.synthesizeSpeech(request);
            const assistantDir = path.join(userDir, 'assistant');
            if (!fs.existsSync(assistantDir)) {
                fs.mkdirSync(assistantDir, { recursive: true });
            }
            const assistantAudioPath = path.join(assistantDir, `${currentDate}.mp3`);
            await writeFile(assistantAudioPath, response.audioContent, 'binary');
            console.log(`Audio content written to file: ${assistantAudioPath}`);
            res.status(200).json({
                ...response,
                src: assistantAudioPath.replace(path.join(__dirname, '..', '..', 'public'), '')
            });
        });
    };

    TTS().then(() => {
    }).catch((err) => {
        console.log(err);
        if (err instanceof Error) {
            logger.error(`An error occurred: ${err.message}`);
        }
        return res.status(500).json({ error: err.message });
    });
}

export const getGCPCredentials = () => {
    return process.env.GCP_PRIVATE_KEY
        ? {
            credentials: {
                client_email: process.env.GCP_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GCP_PRIVATE_KEY,
            },
            projectId: process.env.GCP_PROJECT_ID,
        }
        : {
            projectId: process.env.GCP_PROJECT_ID,
        };
};

async function authenticateImplicitWithAdc() {
    const storage = new Storage(getGCPCredentials());
    const [buckets] = await storage.getBuckets();
    console.log('Buckets:');

    for (const bucket of buckets) {
        console.log(`- ${bucket.name}`);
    }

    console.log('Listed all storage buckets.');
}

authenticateImplicitWithAdc();
