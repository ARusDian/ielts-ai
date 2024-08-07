import { NextApiRequest, NextApiResponse } from "next";
const textToSpeech = require('@google-cloud/text-to-speech');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const util = require('util');

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

export default function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const TTS = async () => {
        await authenticateImplicitWithAdc().then(async () => {
            const client = new textToSpeech.TextToSpeechClient();

            const { text, audio, user, chatLogs, answer, isInit } = req.body;   
                        
            // safe base64 wav file to disk
            const base64Data = audio.replace(/^data:audio\/wav;base64,/, '');
            const currentDate = new Date().getTime()

            if (!fs.existsSync('public/audio/records/')) {
                fs.mkdirSync('public/audio/records/');
            }

            const path = 'public/audio/records/' + user + '/';
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path);
            }

            if (!fs.existsSync(path + "user/")) {
                fs.mkdirSync(path + "user/");
            }
            if (!isInit) {
                const fileName = "user/" + currentDate + '.wav'
                console.log("User audio path", path + fileName)
                fs.writeFileSync(path + fileName, base64Data, 'base64');
            }
            // write chat logs to file txt
            const chatLogsPath = path + "chatLogs" + '.txt'
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
            const dir = path + 'assistant/';
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            await writeFile(dir  + currentDate + '.mp3', response.audioContent, 'binary');
            console.log(`Audio content written to file: ${dir + currentDate + '.mp3'}`);
            res.status(200).json({
                ...response,
                src: dir.replace("public/", "") + currentDate + '.mp3'
            })
        });
    }
    TTS().then(() => {
    }).catch((err) => {
        console.log(err);
        return res.status(500).json({ error: err.message });
    });
}

export const getGCPCredentials = () => {
    // for Vercel, use environment variables
    return process.env.GCP_PRIVATE_KEY
        ? {
            credentials: {
                client_email: process.env.GCP_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GCP_PRIVATE_KEY,
            },
            projectId: process.env.GCP_PROJECT_ID,
        }
        // for local development, use gcloud CLI
        : {
            projectId: process.env.GCP_PROJECT_ID,
        };
};



async function authenticateImplicitWithAdc() {
    // This snippet demonstrates how to list buckets.
    // NOTE: Replace the client created below with the client required for your application.
    // Note that the credentials are not specified when constructing the client.
    // The client library finds your credentials using ADC.
    const storage = new Storage(getGCPCredentials());
    const [buckets] = await storage.getBuckets();
    console.log('Buckets:');

    for (const bucket of buckets) {
        console.log(`- ${bucket.name}`);
    }

    console.log('Listed all storage buckets.');
}

authenticateImplicitWithAdc();
