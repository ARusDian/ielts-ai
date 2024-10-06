import os
import wave
import soundfile as sf
import numpy as np
import librosa
import json
import ast
import re
import math
from typing import Union
from openai import OpenAI
import argparse
from dotenv import load_dotenv, find_dotenv
import logging


# Konfigurasi logging
def setup_logger(log_file: str):
    """
    Setup logger to log error messages to a file.

    Args:
        log_file (str): Path to the log file.
    """
    # Set up logging configuration
    logging.basicConfig(
        level=logging.ERROR,
        format="%(asctime)s - %(levelname)s - %(message)s",
        handlers=[
            logging.FileHandler(log_file),  # Log to file
            logging.StreamHandler(),  # Optional: Print to console
        ],
    )


root_path = os.path.join(os.getcwd(), "public/audio/records")
global CLIENT


def evaluate_conversation(username: str) -> list:
    """
    Evaluate a user's conversation with a chatbot based on four criteria: fluency and coherence, lexical resource, grammar, and pronunciation. The results are then used to calculate an overall IELTS-style score between 0 and 9.

    Args:
        username (str): Username of the user to evaluate.

    Returns:
        list: List of scores in the following order: fluency and coherence, lexical resource, grammar, pronunciation, and overall IELTS-style score.
    """
    scores = {
        "fluency_and_coherence": 0,
        "lexical_resource": 0,
        "grammar": 0,
        "pronunciation": 0,
    }
    user_dir = os.path.join(root_path, username)
    sound_dir = os.path.join(user_dir, "user")
    chat_log_path = os.path.join(user_dir, "chatLogs.txt")

    with open(chat_log_path, "r") as file:
        chat_logs = json.load(file)

    user_messages = [chat["content"] for chat in chat_logs if chat["role"] == "user"]

    # Preprocess user messages
    corrected_punctuation = get_chatgpt_response(
        f"{user_messages}\n\nEach list is a paragraph, correct the punctuation of each paragraph by maintaining all the words without changing them at all, ther result must be on python list",
        parse_json=False,
    )

    sentences_per_paragraph = [
        re.split(r"(?<!\d)\.(?!\d)", chat) for chat in corrected_punctuation
    ]
    sentences_per_paragraph = [
        list(filter(lambda x: x.strip() != "", sentences))
        for sentences in sentences_per_paragraph
    ]

    all_sentences = []

    # Combine all sentences
    for i, sentences in enumerate(sentences_per_paragraph):
        for j, sentence in enumerate(sentences):
            all_sentences.append(sentence.strip())

    scores["fluency_and_coherence"] = fluency_coherence_score(
        corrected_punctuation, sound_dir, all_sentences
    )
    scores["lexical_resource"] = lexical_resource_score(corrected_punctuation)
    scores["grammar"] = grammar_score(all_sentences)
    scores["pronunciation"] = pronunciation_score(all_sentences)

    ielts_score = calculate_ielts_score(
        scores["fluency_and_coherence"],
        scores["lexical_resource"],
        scores["grammar"],
        scores["pronunciation"],
    )

    # return [
    #     scores["fluency_and_coherence"],
    #     scores["lexical_resource"],
    #     scores["grammar"],
    #     scores["pronunciation"],
    #     ielts_score,
    # ]
    
    return json.dumps({
        "fluency_and_coherence": scores["fluency_and_coherence"],
        "lexical_resource": scores["lexical_resource"],
        "grammar": scores["grammar"],
        "pronunciation": scores["pronunciation"],
        "ielts_score": ielts_score
    })


def convert_to_ielts_score(metric_score):
    """
    Convert a metric score from a scale of 1-100 to a scale of 1-9, as used by the IELTS.

    Parameters:
        metric_score (float): Score in the range 1-100.

    Returns:
        float: Score in the range 1-9.
    """
    return (((min(metric_score, 100)) - 1) / 99) * 8 + 1


def calculate_ielts_score(fluency_coherence, lexical_resource, grammar, pronunciation):
    """
    Calculate the overall IELTS score from the four individual scores.

    Parameters:
        fluency_coherence (float): Fluency and coherence score (1-100).
        lexical_resource (float): Lexical resource score (1-100).
        grammar (float): Grammar score (1-100).
        pronunciation (float): Pronunciation score (1-100).

    Returns:
        float: Overall IELTS score (1-9).
    """
    fluency_coherence_ielts = convert_to_ielts_score(fluency_coherence)
    lexical_resource_ielts = convert_to_ielts_score(lexical_resource)
    grammar_ielts = convert_to_ielts_score(grammar)
    pronunciation_ielts = convert_to_ielts_score(pronunciation)

    overall_ielts_score = (
        fluency_coherence_ielts
        + lexical_resource_ielts
        + grammar_ielts
        + pronunciation_ielts
    ) / 4
    return overall_ielts_score


def pronunciation_score(all_sentences):
    """
    Evaluate the pronunciation of all sentences by identifying the number of incorrect words in each sentence due to pronunciation mistakes.

    Parameters:
        all_sentences (list): A list of sentences to be evaluated.

    Returns:
        float: The pronunciation score as a percentage from 0 to 100.
    """
    prompt = f"""
{all_sentences}

The following sentences are the result of TTS (Text-to-Speech) conversion, so there might be pronunciation errors. Identify which words are likely incorrect or wrong due to pronunciation mistakes in each sentence, and only provide the number of incorrect words in each sentence. The final result should only include the total number of incorrect words with format :.
{{
"values": total_incorrect_words,
"desc": description
}}
"""
    total_incorrect_words = get_chatgpt_response(prompt=prompt)

    words = []

    for sentence in all_sentences:
        for word in sentence.split():
            words.append(word)
    pronunciation_result = (1 - (total_incorrect_words["values"] / len(words))) * 100

    # print("Pronunciation Score", pronunciation_result)
    return pronunciation_result


def grammar_score(all_sentences):
    """
    Calculate the grammar score of the given sentences.

    The grammar score is the proportion of sentences with correct grammar
    out of the total number of sentences.

    Parameters
    ----------
    all_sentences : list
        A list of strings, each of which is a sentence.

    Returns
    -------
    float
        The grammar score as a proportion of correct sentences out of the total number of sentences.

    """

    prompt = f"""
{all_sentences}


From the list, how many sentences have correct grammar? These sentences are conversational sentences. Provide the count in the following format:

{{
"correct": number_of_correct_sentences,
}}
"""
    correct_sentences = get_chatgpt_response(prompt)

    grammar_score = correct_sentences["correct"] / len(all_sentences) * 100
    # print(
    #     "Grammar score: ",
    #     grammar_score,
    #     "correct sentences: ",
    #     correct_sentences["correct"],
    #     "total sentences: ",
    #     len(all_sentences),
    # )

    return grammar_score


def lexical_resource_score(list_chat):
    """
    Calculate the lexical resource score of a list of chat messages.

    The lexical resource score is the percentage of unique words in the chat
    messages. The score is then adjusted based on the average word count per
    chat message.

    If the average word count is less than 10, the score is set to 40. If the
    average word count is 20 or more, the score is set to 90 plus 1.5 times the
    difference between the average word count and 20. Otherwise, the score is
    set to 40 plus 5 times the difference between the average word count and 10.

    The final score is calculated as the product of the lexical resource result
    and the adjusted score, capped at 100.

    Args:
        list_chat (list): A list of chat messages.

    Returns:
        float: The final score.
    """
    word_count_dict = {}
    total_word_count = 0

    # Process each chat message
    for chat in list_chat:
        # Remove special characters and digits, convert to lowercase
        chat = "".join(e for e in chat if e.isalnum() or e.isspace()).lower()

        # Split chat into words
        words = chat.split()
        total_word_count += len(words)

        # Count the frequency of each word
        for word in words:
            word_count_dict[word] = word_count_dict.get(word, 0) + 1

    # Calculate the average word count per chat
    average_word_count = total_word_count / len(list_chat) if len(list_chat) > 0 else 0

    # Set threshold for determining unique words
    threshold = 4
    unique_words = [
        word for word in word_count_dict if word_count_dict[word] < threshold
    ]

    # Calculate lexical resource score
    len_words = len(word_count_dict)
    len_unique_words = len(unique_words)

    lexical_resource_result = (
        (len_unique_words / len_words) * 100 if len_words > 0 else 0
    )

    # print("Lexical resource result: ", lexical_resource_result)

    # Determine the score based on average word count
    if average_word_count < 10:
        final_score = 40
    elif average_word_count >= 20:
        final_score = (
            90 + min((average_word_count - 20), 10) * 1.5
        )  # Incremental increase
    else:
        final_score = (
            40 + (average_word_count - 10) * 5
        )  # Linear increase from 40 to 90

    # print("scaler", final_score)

    # Calculate final score as a product of lexical resource result and adjusted score
    final_score = min(100, (final_score / 100) * lexical_resource_result)

    # print("Final score: ", final_score)
    return final_score


def fluency_coherence_score(list_chat, sound_dir, all_sentences):
    """
    Calculate the fluency coherence score of a list of chat messages.

    The fluency coherence score is the average of the fluency score and the coherence score.

    The fluency score is calculated as the percentage of words per minute the chat messages
    are spoken at, adjusted based on the average word count. If the average word count is less than 10,
    the score is set to 40. If the average word count is 20 or more, the score is set to 90 plus 1.5 times the
    difference between the average word count and 20. Otherwise, the score is set to 40 plus 5 times the difference
    between the average word count and 10.

    The coherence score is calculated by evaluating the coherence of each paragraph / list based on the usage of
    conjunctions, transition words, and other cohesive devices between sentences. Each paragraph should be assessed
    separately, as they are not related to each other. Calculate the average coherence score for the sentences within
    each paragraph and give ONLY the final result as a percentage.

    Args:
        list_chat (list): A list of chat messages.
        sound_dir (str): The directory of the sound files.
        all_sentences (list): A list of all sentences.

    Returns:
        float: The final score.
    """
    durations = getWavDuration(sound_dir)
    word_lengths = []
    
    if len(durations) == 0:
        raise ValueError("No .wav files found in the sound directory.")
    
    if len(durations) != len(list_chat):
        raise ValueError("The lengths of durations and list_chat do not match.")

    for chat in list_chat:
        word_lengths.append(len(chat.split()))

    # print("Word lengths: ", word_lengths)
    # print("Duration: ", durations)

    mean_fluency = np.mean(np.array(word_lengths) / np.array(durations))
    # print("Mean fluency: ", mean_fluency)

    wordpermin = mean_fluency * 60
    # print("Word per minute: ", wordpermin)

    sigma = 32.5  # standard deviation
    deviation = wordpermin - 120
    fluency_score = 100 * math.exp(-(deviation**2) / (2 * sigma**2))

    # print("Fluency score: ", fluency_score)

    prompt = f"""
{list_chat}

Evaluate the coherence of each paragraph / list based on the usage of conjunctions, transition words, and other cohesive devices between sentences. Each paragraph should be assessed separately, as they are not related to each other. Calculate the average coherence score for the sentences within each paragraph and give ONLY the final result as a percentage.

```json
{{
"value" : coherence_score,
"description" : "Coherence score for each paragraph based on the usage of cohesive devices between sentences."
}}
```
"""
    result = get_chatgpt_response(prompt)

    coherence_score = result["value"]

    fluency_coherence_result = (fluency_score + coherence_score) / 2

    # print("Coherence score: ", coherence_score)
    # print("Fluency coherence score: ", fluency_coherence_result)

    return fluency_coherence_result


def getWavDuration(soundPath):
    """
    Get the duration of each .wav file in soundPath.

    Args:
        soundPath (str): The path to the directory containing the .wav files.

    Returns:
        list: A list of durations in seconds, one for each .wav file in soundPath.
    """
    sound_durations = []

    for file in os.listdir(soundPath):
        if file.endswith(".wav"):
            file_path = os.path.join(soundPath, file)
            x, _ = librosa.load(file_path, sr=16000)
            sf.write(file_path, x, 16000)
            wave.open(file_path, "r")

            duration = librosa.get_duration(path=file_path)
            sound_durations.append(duration)

    return sound_durations


def get_chatgpt_response(
    prompt: str, max_retries: int = 15, parse_json: bool = True
) -> Union[list, dict]:
    """
    Get a response from the AI assistant.

    Args:
        prompt (str): The prompt to give to the AI.
        max_retries (int, optional): The maximum number of times to retry if the AI
            does not respond. Defaults to 10.
        parse_json (bool, optional): Whether to return the response as a JSON object. Defaults to True.

    Returns:
        Union[list, dict]: The response from the AI. If parse_json is True, the response is returned as a JSON object.
            Otherwise, the response is returned as a list of strings.

    Raises:
        Exception: If the AI does not respond after max_retries attempts.
    """
    for attempt in range(max_retries):
        try:
            response = CLIENT.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "The following is a conversation between a user and an AI assistant.",
                    },
                    {"role": "user", "content": prompt},
                ],
                model="gpt-3.5-turbo",
            )

            response_content = response.choices[0].message.content

            if parse_json:
                return json.loads(response_content)
            else:
                return ast.literal_eval(response_content)

        except (json.JSONDecodeError, SyntaxError):
            logging.error(f"Failed to parse response as JSON: {response_content}")
            continue  # Continue to the next attempt if parsing fails
            
        except Exception as e:
            print(f"Error: {e}")
            logging.error(f"Error: {e}")
            continue

    logging.error("Failed to get a response from the AI after multiple attempts.")
    raise Exception("Failed to get a response from the AI after multiple attempts.")


if __name__ == "__main__":
    # Specify the path to the .env.local file
    env_path = find_dotenv(".env.local")

    # Load the environment variables from the .env.local file
    load_dotenv(dotenv_path=env_path)
    parser = argparse.ArgumentParser()
    parser.add_argument('--user', type=str, help="user name")
    api_key = os.getenv("NEXT_PUBLIC_OPENAI_API_KEY")
    args = parser.parse_args()
    CLIENT = OpenAI(api_key=api_key)
    log_dir = os.path.join(os.getcwd(), "./logs")
    os.makedirs(log_dir, exist_ok=True)
    log_file_path = os.path.join(log_dir, "evaluation-error.log")
    
    setup_logger(log_file_path)

    print(evaluate_conversation(args.user))
