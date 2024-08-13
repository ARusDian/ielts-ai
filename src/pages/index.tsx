import Link from "next/link";
import React, { useEffect, useState, useRef, use } from "react";
import OpenAI from 'openai';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { ChatCompletionMessageParam } from "openai/resources/chat";
import ReactLoading from 'react-loading';
import Rodal from 'rodal';

import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

import CircularProgress from "@/components/CircularProgress";

// import { retryFunc } from "@/utils/retryFunc";

// include styles
import 'rodal/lib/rodal.css';

import router from "next/router";
import { useRecordVoice } from "@/hooks/useRecordVoice";

type ResultData = {
    fluency_and_coherence: {
        "avoid silence or hesitation?": string,
        "Speak at length on each topic?": string,
        "Use words to connect ideas?": string,
        "Score": string,
    },
    lexical_resource: {
        "Use a wide range of vocabulary?": string,
        "Use idioms and collocation?": string,
        "Paraphrase?": string,
        "Score": string,
    },
    grammatical_range_and_accuracy: {
        "Speak in complex sentences?": string,
        "Use a variety of grammatical forms?": string,
        "Avoid grammatical mistakes?": string,
        "Score": string,
    },
    pronunciation: {
        "Pronounce words accurately?": string,
        "Join sounds together?": string,
        "Vary intonation?": string,
        "Score": string,
    },
    general_feedback: {
        "comments": string,
        "average_score": string,
    },
}


export default function index() {
    const { startRecording, stopRecording, base64 } = useRecordVoice();

    const openai = new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
    });

    const assessmentAspect = {
        0: {
            "fluency_and_coherence": 'does not attend',
            "lexical_resource": 'does not attend',
            "grammatical_range_and_accuracy": 'does not attend',
            "pronunciation": 'does not attend',
        },
        1: {
            "fluency_and_coherence": 'no communication possible and no rateable language',
            "lexical_resource": 'no communication possible and no rateable language',
            "grammatical_range_and_accuracy": 'no communication possible and no rateable language',
            "pronunciation": 'no communication possible and no rateable language',
        },
        2: {
            "fluency_and_coherence": 'pauses lengthily before most words, little communication possible',
            "lexical_resource": 'only produces isolated words or memorised utterances',
            "grammatical_range_and_accuracy": 'cannot produce basic sentence forms',
            "pronunciation": 'speech is often unintelligible',
        },
        3: {
            "fluency_and_coherence": 'speaks with long pauses, has limited ability to link simple sentences, gives only simple responses and is frequently unable to convey basic message',
            "lexical_resource": 'uses simple vocabulary to convey personal information, has insufficient vocabulary for less familiar topics',
            "grammatical_range_and_accuracy": 'attempts basic sentence forms but with limited success, or relies on apparently memorised utterances, makes numerous errors except in memorised expressions',
            "pronunciation": 'shows some of the features of Band 2 and some, but not all, of the positive features of Band 4',
        },
        4: {
            "fluency_and_coherence": 'cannot respond without noticeable pauses and may speak slowly, with frequent repetition and self-correction, links basic sentences but with repetitious use of simple connectives and some breakdowns in coherence',
            "lexical_resource": 'is able to talk about familiar topics but can only convey basic meaning on unfamiliar topics and makes frequent errors in word choice, rarely attempts paraphrase',
            "grammatical_range_and_accuracy": 'produces basic sentence forms and some correct simple sentences but subordinate structures are rare, errors are frequent and may lead to misunderstanding',
            "pronunciation": 'uses a limited range of pronunciation features, attempts to control features but lapses are frequent, mispronunciations are frequent and cause some difficulty for the listener',
        },
        5: {
            "fluency_and_coherence": 'usually maintains flow of speech but uses repetition, self-correction and/or slow speech to keep going, may over-use certain connectives and discourse markers, produces simple speech fluently, but more complex communication causes fluency problems',
            "lexical_resource": 'manages to talk about familiar and unfamiliar topics but uses vocabulary with limited flexibility, attempts to use paraphrase but with mixed success',
            "grammatical_range_and_accuracy": 'produces basic sentence forms with reasonable accuracy, uses a limited range of more complex structures, but these usually contain errors and may cause some comprehension problems',
            "pronunciation": 'shows all the positive features of Band 4 and some, but not all, of the positive features of Band 6',
        },
        6: {
            "fluency_and_coherence": 'is willing to speak at length, though may lose coherence at times due to occasional repetition, self-correction or hesitation, uses a range of connectives and discourse markers but not always appropriately',
            "lexical_resource": 'has a wide enough vocabulary to discuss topics at length and make meaning clear in spite of inappropriacies, generally paraphrases successfully',
            "grammatical_range_and_accuracy": 'uses a mix of simple and complex structures, but with limited flexibility, may make frequent mistakes with complex structures, though these rarely cause comprehension problems',
            "pronunciation": 'uses a range of pronunciation     features with mixed control, shows some effective use of features but this is not sustained, can generally be understood throughout, though mispronunciation of individual words or sounds reduces clarity at times',
        },
        7: {
            "fluency_and_coherence": 'speaks at length without noticeable effort or loss of coherence, may demonstrate language-related hesitation at times, or some repetition and/or self-correction, uses a range of connectives and discourse markers with some flexibility',
            "lexical_resource": 'uses vocabulary resource flexibly to discuss a variety of topics, uses some less common and idiomatic vocabulary and shows some awareness of style and collocation, with some inappropriate choices, uses paraphrase effectively',
            "grammatical_range_and_accuracy": 'uses a range of complex structures with some flexibility, frequently produces error-free sentences, though some grammatical mistakes persist',
            "pronunciation": 'shows all the positive features of Band 6 and some, but not all, of the positive features of Band 8',
        },
        8: {
            "fluency_and_coherence": 'speaks fluently with only occasional repetition or self-correction; hesitation is usually content-related and only rarely to search for language, develops topics coherently and appropriately',
            "lexical_resource": 'uses a wide vocabulary resource readily and flexibly to convey precise meaning, uses less common and idiomatic vocabulary skilfully, with occasional inaccuracies, uses paraphrase effectively as required',
            "grammatical_range_and_accuracy": 'uses a wide range of structures flexibly, produces a majority of error-free sentences with only very occasional inappropriacies or basic/nonsystematic errors',
            "pronunciation": 'uses a wide range of pronunciation features, sustains flexible use of features, with only occasional lapses, is easy to understand throughout; L1 accent has minimal effect on intelligibility',
        },
        9: {
            "fluency_and_coherence": 'speaks fluently with only rare repetition or self-correction; any hesitation is content-related rather than to find words or grammar, speaks coherently with fully appropriate cohesive features, develops topics fully and appropriately',
            "lexical_resource": 'uses vocabulary with full flexibility and precision in all topics, uses idiomatic language naturally and accurately',
            "grammatical_range_and_accuracy": 'uses a full range of structures naturally and appropriately, produces consistently accurate structures apart from ‘slips’ characteristic of native speaker speech',
            "pronunciation": 'uses a full range of pronunciation features with precision and subtlety, sustains flexible use of features throughout, is effortless to understand',
        },
    };

    const assessmentFormat = {
        "fluency_and_coherence": {
            "avoid silence or hesitation?": '[please this by your judgment based on the provided input, example but must not be same: Willing to engage in conversation, with occasional hesitation]',
            "Speak at length on each topic?": '[please this by your judgment based on the provided input, example but must not be same: Included relevant detail]',
            "Use words to connect ideas?": '[please this by your judgment based on the provided input, example but must not be same: As appropriate]',
            "Score": '[give it based on the above points , must be round number]',
        },
        "lexical_resource": {
            "Use a wide range of vocabulary?": '[please this by your judgment based on the provided input, example but must not be same: Sufficient to discuss topics at some length]',
            "Use idioms and collocation?": '[please this by your judgment based on the provided input, example but must not be same: eaning usually clear despite some inappropriate choices]',
            "Paraphrase?": '[please this by your judgment based on the provided input, example but must not be same: Generally successful]',
            "Score": '[give it based on the above points, must be round number]',
        },
        "grammatical_range_and_accuracy": {
            "Speak in complex sentences?": '[please this by your judgment based on the provided input, example but must not be same: Complex sentences had inaccuracies but the meaning was usually still clear.]',
            "Use a variety of grammatical forms?": '[please this by your judgment based on the provided input, example but must not be same: Good variety, but verb forms need care. ]',
            "Avoid grammatical mistakes?": '[please this by your judgment based on the provided input, example but must not be same: Some self-corrections]',
            "Score": '[give it based on the above points, must be round number]',
        },
        "pronunciation": {
            "Pronounce words accurately?": '[please this by your judgment based on the provided input, example but must not be same: Generally easy to understand]',
            "Join sounds together?": '[please this by your judgment based on the provided input, example but must not be same: Developing a smoother flow of sounds would improve pronunciation overall.]',
            "Vary intonation?": '[please this by your judgment based on the provided input, example but must not be same: Used appropriate intonation.]',
            "Score": '[give it based on the above points, must be round number]',
        },
        "general_feedback": {
            "comments": '[please this by your judgment based on the provided input, example but must not be same: You engaged well in our conversation during the interview and clearly demonstrated your skills in English. You might consider joining Toastmasters to further develop your confidence and public speaking skills in English. Best wishes for the future.]',
            "average_score": '[please fill this by the average of each aspects score]',
        }

    };

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition,
    } = useSpeechRecognition();

    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const [chatLogs, setChatLogs] = useState<ChatCompletionMessageParam[]>([])
    const TIME = 90;


    const [isStart, setIsStart] = useState<boolean>(false);
    const [timeLeft, setTimeLeft] = useState<number>(0);

    const [userName, setUserName] = useState<string>("");
    const [startError, setStartError] = useState<string>("");

    const [showResultModal, setShowResultModal] = useState<boolean>(false);
    const [isResultReady, setIsResultReady] = useState<boolean>(false);

    const [result, setResult] = useState<ResultData | null>();


    const [errorResult, setErrorResult] = useState<{
        isErrorResult: boolean,
        message: string
    }>({
        isErrorResult: false,
        message: ""
    });


    const handleStopListening = () => {
        stopRecording();
        SpeechRecognition.stopListening();
        console.log("stop listening");
    }

    const handleStartListening = () => {
        startRecording();
        SpeechRecognition.startListening({
            continuous: true,
            language: "en-US"
        });
        console.log("start listening");
        setTimeLeft(TIME);
    }

    useEffect(() => {
        if (listening) {
            const timer = setInterval(() => {
                setTimeLeft(prevTime => {
                    if (prevTime <= 1) {
                        handleStopListening();
                        clearInterval(timer);
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        } else {
            setTimeLeft(TIME);
        }
    }, [listening]);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [JSON.stringify(chatLogs)])

    useEffect(() => {
        if (isStart) {
            const newname = `${userName}-${new Date().getTime()}`
            setUserName(newname);
            generateQuestion(newname);
        }
    }, [isStart]);
    useEffect(() => {
        console.log(transcript)
        if (!listening && chatLogs.length > 0) {
            generateQuestion();
        }
    }, [base64]);

    useEffect(() => {

        const getResult = async () => {
            setIsResultReady(false);
            const maxAttempt = 10;
            console.log("getting Result...")
            let isDone = false;

            // DEV-Mode
            // const text = "Last weekend, me and my best buddy, we goes on a road trip. We drives for hours, and it was so much fun! We sees all kinds of interesting places, like a big, old castle on top of a hill. It was really cool, and we takes a selfie there. Then, we goes to this little town with a huge ice cream shop. They has like a hundred flavors, and I eats a big, chocolate sundae. It was delicious!\nMy sister, she don't likes to wake up early in the morning. She stays up late watching TV and then sleeps in until noon. She says it's the best way to get enough rest. But, sometimes, she misses important meetings and classes. I tells her to set an alarm, but she never listens. It's like she wants to be late all the time!\nAt my job, we has a big office party every year. Last year, we goes to a fancy restaurant. They serves the most delicious food, like lobster and caviar. I tries them for the first time, and it was interesting. But, the best part was the dancing. We dances all night long, and I have so much fun. I can't wait for this year's party!\nWhen I was a kid, I don't likes vegetables. My mom always tries to make me eats them, but I don't listens. I hides them under the table or gives them to the dog. Now, I realizes that vegetables are good for you, and I eats them every day. I wish I had listened to my mom when I was younger.\nMe and my friends, we goes camping every summer. We brings tents, sleeping bags, and lots of marshmallows for roasting. Last year, we goes to a remote forest. It was so quiet, and we hears the sounds of nature all around us. We tells scary stories by the campfire and laughs until late at night. It's the best way to spend the summer!\n"
            let arrtext = chatLogs.filter(chat => chat.role === "user")
            arrtext.pop();
            arrtext.pop();

            const text = arrtext.map(chat => chat.content).join(" ");

            // const text = chatLogs.filter(chat => chat.role === "user").map(chat => chat.content).join(" ");
            const command = "Please check the aspect of fluency and coherence, lexical resource, grammatical range and accuracy, pronunciation from 0 - 9 based on below context " + "\n" + JSON.stringify(assessmentAspect) + "\n" + "The output must be only exactly similar like below and the total value force to be not more than 8 maximum 9 if the user give long text :" + "\n" + JSON.stringify(assessmentFormat);

            console.log("text :", text);
            for (let i = 0; i < maxAttempt; i++) {
                try {
                    console.log("attempt :", i);
                    const completion = await openai.chat.completions.create({
                        messages: [
                            {
                                role: "user",
                                content: text
                            },
                            {
                                role: "assistant",
                                content: command
                            },
                        ],
                        model: 'gpt-3.5-turbo-0125',
                        max_tokens: 4000
                    });
                    console.log(completion.choices[0].message.content);

                    const result = JSON.parse(completion.choices[0].message.content ?? "")
                    if (result["fluency_and_coherence"]["Score"] === "" || result["lexical_resource"]["Score"] === "" || result["grammatical_range_and_accuracy"]["Score"] === "" || result["pronunciation"]["Score"] === "" || result["general_feedback"]["average_score"] === "") {
                        throw new Error("result is not valid");
                    }
                    setResult(result);
                    setIsResultReady(true)
                    return true;
                } catch (err: unknown) {
                    console.log("Error :", err);
                    console.log("retrying :", i);
                    setErrorResult({ isErrorResult: false, message: `Trying gathering your results for ${i} times.` });
                    const isLastAttempt = i + 1 === maxAttempt;
                    if (isLastAttempt) {

                        setErrorResult({ isErrorResult: true, message: "We can not retrieve your results, please check your internet connection!" });
                    }
                }
            }
        };


        if (showResultModal) {
            getResult();
        }
    }, [showResultModal])

    const generateQuestion = async (uname?: string) => {
        const prompt = {
            role: "assistant", content: transcript !== "" ?
                `generate one question without quotes marks according to to response statement : ${transcript}` :
                "generate one question that commonly used in IELTS without quotes marks"
        } as ChatCompletionMessageParam

        const completion = await openai.chat.completions.create({
            messages: [...chatLogs, prompt],
            model: 'gpt-3.5-turbo-0125',
        });

        const newQuestion = completion.choices[0].message.content;

        if (chatLogs.length > 0) {
            setChatLogs([...chatLogs, { role: "user", content: transcript }, { role: "assistant", content: newQuestion }])
        } else {
            setChatLogs([...chatLogs, { role: "assistant", content: newQuestion }])
        }
        fetch("api/synthesize-single", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                isInit: uname ? true : false,
                text: completion.choices[0].message.content,
                audio: base64,
                user: uname || userName,
                answer: transcript,
                chatLogs: chatLogs
            }),
        }).then((res) => res.json()).then(
            (data) => {
                const audio = document.getElementById("MyAudio") as HTMLAudioElement;
                audio?.removeAttribute('src');
                audio.src = data.src;
                audio.play();
            }
        );

        resetTranscript();

    }

    return (
        <div className="flex w-[100vw] h-[100vh] flex-col px-20 py-12 gap-10 bg-white">
            {
                isStart ? (
                    <>
                        <section className="w-[100%] max-w-[1300px] h-[90%] mx-auto flex justify-center items-center flex-col relative rounded-3xl shadow-2xl shadow-sky-400/50">



                            <div className="w-[100%] h-[100%] p-5 overflow-y-scroll flex flex-col gap-3" style={{ scrollbarWidth: "none", }} ref={scrollContainerRef}>
                                {chatLogs.map((chat, index) => (
                                    <div key={index} className="flex">
                                        {chat.role === "assistant" ? (
                                            <div
                                                className="bg-blue-400 px-6 py-5 text-lg text-white"
                                                style={{ borderRadius: "50px", borderTopLeftRadius: 0, marginBottom: "5px" }}
                                            >
                                                <p>{chat.content}</p>
                                            </div>
                                        ) : (
                                            <div
                                                className="bg-blue-200 px-6 py-5 text-lg text-blue-400 min-w-[75px] max-w-[500px] ml-auto"
                                                style={{ borderRadius: "50px", borderTopRightRadius: 0, marginBottom: "5px" }}
                                            >
                                                {
                                                    // @ts-ignore
                                                    <p className="text-end">{chat.content}</p>
                                                }
                                            </div>
                                        )}
                                    </div >
                                ))}
                                {listening && (
                                    <div
                                        className="px-6 py-5 text-lg text-blue-400 min-w-[75px] max-w-[500px] ml-auto"
                                        style={{ borderRadius: "50px", borderTopRightRadius: 0, marginBottom: "5px" }}
                                    >

                                        {
                                            listening ? (
                                                <div className="relative w-[100px] h-[100px]">
                                                    {/* <svg className="z-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" id="Mic" x="0" y="0" version="1.1" viewBox="0 0 29 29" width="50">
                                                        <path d="M14.5 17a3.5 3.5 0 0 1-3.5-3.5v-8a3.5 3.5 0 1 1 7 0v8a3.5 3.5 0 0 1-3.5 3.5z" fill="#4da5cb" className="color000000 svgShape"></path>
                                                        <path d="M20 10v3.5c0 3.032-2.468 5.5-5.5 5.5S9 16.532 9 13.5V10H7v3.5c0 3.796 2.837 6.934 6.5 7.425V25H10v2h9v-2h-3.5v-4.075c3.663-.491 6.5-3.629 6.5-7.425V10h-2z" fill="#4da5cb" className="color000000 svgShape"></path>
                                                    </svg>

                                                    <span className="w-[60%] h-[60%] block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-sky-200 animate-pulse"></span>

                                                    <span className="w-[80%] h-[80%] block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-sky-100 animate-pulse"></span>

                                                    <span className="w-[100%] h-[100%] block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-sky-50 animate-pulse"></span> */}
                                                    <CircularProgressbar value={timeLeft} maxValue={TIME} text={`${timeLeft}`} />
                                                </div>
                                            ) : (<p className="text-end">.....</p>)
                                        }
                                    </div>
                                )}
                            </div>

                            <div className="w-[2%] h-[100%] bg-white absolute right-0"></div>


                        </section>

                        <section className="flex w-[100%] max-w-[1300px] mx-auto justify-between ">
                            <div className="flex-1"></div>
                            <div className="flex-1 flex justify-center items-center gap-5">
                                <button
                                    type="button"
                                    className={`w-[100px] flex flex-col justify-center items-center text-red-700 bg-white focus:ring-2 focus:ring-red-300 font-medium rounded-lg text-sm px-20 py-2.5 mr-2 mb-2 ${!listening ? "" : "hover:bg-red-200"}`}
                                    onClick={handleStopListening}
                                >
                                    <svg fill="#ff2424" height="50px" width="50px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" ><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M256,0C114.615,0,0,114.615,0,256s114.615,256,256,256s256-114.615,256-256S397.385,0,256,0z M336,320 c0,8.837-7.163,16-16,16H192c-8.837,0-16-7.163-16-16V192c0-8.837,7.163-16,16-16h128c8.837,0,16,7.163,16,16V320z"></path> </g></svg>
                                    Stop
                                </button>


                                <button
                                    type="button"
                                    disabled={listening}
                                    className="flex flex-col justify-center items-center text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm w-[100px] p-3"
                                    onClick={handleStartListening}
                                >
                                    {listening ? (
                                        <>
                                            <svg className="animate-pulse" viewBox="0 0 24 24" width="50px" height="50px" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M6 9.85986V14.1499" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> <path d="M9 8.42993V15.5699" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> <path d="M12 7V17" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> <path d="M15 8.42993V15.5699" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> <path d="M18 9.85986V14.1499" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg>
                                            <p>Recording...</p>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="mb-2" fill="#ffffff" height="50px" width="50px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" ><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M45.563,29.174l-22-15c-0.307-0.208-0.703-0.231-1.031-0.058C22.205,14.289,22,14.629,22,15v30 c0,0.371,0.205,0.711,0.533,0.884C22.679,45.962,22.84,46,23,46c0.197,0,0.394-0.059,0.563-0.174l22-15 C45.836,30.64,46,30.331,46,30S45.836,29.36,45.563,29.174z M24,43.107V16.893L43.225,30L24,43.107z"></path> <path d="M30,0C13.458,0,0,13.458,0,30s13.458,30,30,30s30-13.458,30-30S46.542,0,30,0z M30,58C14.561,58,2,45.439,2,30 S14.561,2,30,2s28,12.561,28,28S45.439,58,30,58z"></path> </g> </g></svg>
                                            <p>Start</p>
                                        </>
                                    )}


                                </button>
                            </div>

                            <div className="flex-1 flex justify-end">
                                {/* <button
                                    type="button"
                                    className="flex flex-col justify-center items-center text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm p-5 mb-2 w-[100px]"
                                    onClick={() => setShowResultModal(true)}
                                >
                                    <svg viewBox="0 0 512 512" width="50px" height="50px" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#ffffff"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>report-barchart</title> <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd"> <g id="add" fill="#ffffff" transform="translate(42.666667, 85.333333)"> <path d="M341.333333,1.42108547e-14 L426.666667,85.3333333 L426.666667,341.333333 L3.55271368e-14,341.333333 L3.55271368e-14,1.42108547e-14 L341.333333,1.42108547e-14 Z M330.666667,42.6666667 L42.6666667,42.6666667 L42.6666667,298.666667 L384,298.666667 L384,96 L330.666667,42.6666667 Z M106.666667,85.3333333 L106.666,234.666 L341.333333,234.666667 L341.333333,256 L85.3333333,256 L85.3333333,85.3333333 L106.666667,85.3333333 Z M170.666667,149.333333 L170.666667,213.333333 L128,213.333333 L128,149.333333 L170.666667,149.333333 Z M234.666667,106.666667 L234.666667,213.333333 L192,213.333333 L192,106.666667 L234.666667,106.666667 Z M298.666667,170.666667 L298.666667,213.333333 L256,213.333333 L256,170.666667 L298.666667,170.666667 Z" id="Combined-Shape"> </path> </g> </g> </g></svg>
                                    Get the Result
                                </button> */}
                            </div>
                        </section>

                        <section className="flex justify-center">
                            <div>
                                {browserSupportsSpeechRecognition && (

                                    browserSupportsSpeechRecognition

                                )}
                            </div>
                        </section>



                        <section>
                            <audio
                                id="MyAudio"
                                src=""
                            />
                        </section>
                    </>

                ) : (
                    <div className="flex flex-col items-center justify-center h-screen">
                        <button
                            className="bg-white focus:ring-4 font-medium rounded-lg text-lg px-20 py-10 border border-gray-200 shadow-md hover:shadow-xl"
                            onClick={() => {
                                if (userName.length === 0) {
                                    setStartError("Please enter your name")
                                    return
                                }
                                setIsStart(true)
                            }}
                        >
                            <img src="./speaking-english.jpg" className="w-[400px]" alt="" />
                            <p className="text-blue-500 text-2xl mt-10">Start Speaking Test</p>
                        </button>
                        <div className="mt-10 text-gray-800">
                            <label htmlFor="username" className="text-lg mr-5">Your Name</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                className="border border-gray-300 rounded-md px-3 py-2 mt-2"
                                required
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                            />
                        </div>
                        <p className="text-red-500 mt-5">{startError}</p>
                    </div>
                )
            }

            <Rodal
                animation="zoom"
                visible={showResultModal}
                width={1424 * 0.5}
                height={1424 * 0.65}
                onClose={() => setShowResultModal(false)}
            >
                <div className="relative h-full w-full my-auto flex justify-center flex-col">
                    <div>
                        {isResultReady ? (
                            <div className="flex flex-col justify-center items-center">
                                <h1 className="text-center text-blue-400 text-5xl font-bold">Your Overal Score of Speaking Test</h1>
                                <p className="text-center mt-3 mb-8 text-slate-400">Based on IELTS marketing criteria</p>
                                <table className="min-w-full h-full border border-gray-300 divide-y divide-gray-300">
                                    <thead>
                                        <tr>
                                            <th scope="col"
                                                className="px-6 py-3 bg-gray-200 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                Criteria
                                            </th>
                                            <th scope="col"
                                                className="px-6 py-3 bg-gray-200 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                Score
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-300  text-gray-600">
                                        <tr>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                Fluency and Coherence
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div style={{ width: 100, height: 100 }}>
                                                    {/* <CircularProgress
                                                        value={result?.scores.fluency_and_coherence.Score ?? 0}
                                                    /> */}
                                                    <p>{result?.fluency_and_coherence.Score ?? 0}</p>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                Lexical Resource;
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">

                                                <div style={{ width: 100, height: 100 }}>
                                                    {/* <CircularProgress
                                                        value={result?.scores.lexical_resource.Score ?? 0}
                                                    /> */}
                                                    <p>{result?.lexical_resource.Score ?? 0}</p>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                Grammatical Range and Accuracy
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">

                                                <div style={{ width: 100, height: 100 }}>
                                                    {/* <CircularProgress
                                                        value={result?.scores.grammatical_range_and_accuracy.Score ?? 0}
                                                    /> */}
                                                    <p>{result?.grammatical_range_and_accuracy.Score ?? 0}</p>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                Pronunciation
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">

                                                <div style={{ width: 100, height: 100 }}>
                                                    {/* <CircularProgress
                                                        value={result?.scores.pronunciation.Score ?? 0}
                                                    /> */}
                                                    <p>{result?.pronunciation.Score ?? 0}</p>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* <tr>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        Correct Text
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {result?.correct_text}
                                    </td>
                                </tr> */}
                                    </tbody>
                                </table>

                            </div>

                        ) : (
                            <>
                                {errorResult.isErrorResult ? (
                                    // TODO: Make It To Can Show Error
                                    <div>
                                        ERROR.....
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center my-auto">
                                        <div className="flex flex-col items-center gap-5">
                                            <ReactLoading color="#1964AD" type="spin" />
                                            <p className="text-slate-500">Getting your results...</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        <div className="absolute right-2 bottom-2 flex flex-end text-lg">
                            {isResultReady ? (
                                <button
                                    type="button"
                                    className="inline-flex flex-end px-10 py-2 font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                                    onClick={() => {
                                        setShowResultModal(false);
                                    }}
                                >
                                    Close
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="inline-flex flex-end px-10 py-2 font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                                    onClick={() => {
                                        setShowResultModal(false);
                                    }}
                                >
                                    Cancel
                                </button>
                            )
                            }
                        </div>
                    </div>
                </div>
            </Rodal>
        </div >
    )
}
