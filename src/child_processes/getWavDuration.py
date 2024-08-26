# get path from arg sound directory

import librosa
import os
import argparse
import soundfile as sf
import wave

def getWavDuration(soundPath):
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

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--soundPath', type=str, help="path to sound directory")
    args = parser.parse_args()
    print(getWavDuration(args.soundPath))
