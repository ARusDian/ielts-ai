"use client";
import { useEffect, useState, useRef } from "react";
import { blobToBase64 } from "@/utils/blobToBase64";
import { createMediaStream } from "@/utils/createMediaStream";

export const useRecordVoice = () => {
    const [base64, setBase64] = useState("");
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [recording, setRecording] = useState(false);
    const isRecording = useRef(false);
    const chunks = useRef([]);

    const startRecording = () => {
        if (mediaRecorder) {
            isRecording.current = true;
            mediaRecorder.start();
            setRecording(true);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            isRecording.current = false;
            mediaRecorder.stop();
            setRecording(false);
        }
    };

    const getText = async (base64data: string) => {
        try {
            setBase64("data:audio/wav;base64," + base64data);
            return base64data;
        } catch (error) {
            console.log(error);
        }
    };

    const initialMediaRecorder = (stream: MediaStream) => {
        const mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.onstart = () => {
            // @ts-ignore
            createMediaStream(stream)
            chunks.current = [];
        };

        mediaRecorder.ondataavailable = (ev) => {
            // @ts-ignore
            chunks.current.push(ev.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(chunks.current, { type: "audio/wav" });
            blobToBase64(audioBlob, getText);
        };

        setMediaRecorder(mediaRecorder);
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            navigator.mediaDevices
                .getUserMedia({ audio: true })
                .then(initialMediaRecorder);
        }
    }, []);

    return { recording, startRecording, stopRecording, base64 };
}
