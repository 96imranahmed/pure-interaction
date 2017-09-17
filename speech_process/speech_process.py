import speech_recognition as sr

glob_intent = 0 

def speech_rec():
    global glob_intent
    r = sr.Recognizer()
    r.energy_threshold = 400
    r.dynamic_energy_threshold = False
    m = sr.Microphone()
    try:
        while True:
            with m as source: 
                try:    
                    audio = r.listen(source, timeout=3)
                    # recognize speech using Google Speech Recognition
                    value = r.recognize_bing(audio, key="8d58ac3096924631a8828c61ac612f8f")
                    if 'forward' in value.lower():
                        intent = 1
                    elif 'back' in value.lower():
                        intent = -1
                    else: 
                        intent = 0
                    glob_intent = intent
                    print(value)
                except sr.UnknownValueError:
                    print("Unknown Data")
                except sr.RequestError as e:
                    print("Couldn't process results; {0}".format(e))
                except Exception as e:
                    pass
    except KeyboardInterrupt:
        pass
