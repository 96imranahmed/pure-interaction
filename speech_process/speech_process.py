import speech_recognition as sr

glob_intent = 0 

def speech_rec():
    global glob_intent
    m = sr.Microphone()
    r = sr.Recognizer()
    with m as source: 
        r.adjust_for_ambient_noise(source, duration = 2)
    r.energy_threshold = 1.1*r.energy_threshold
    r.dynamic_energy_threshold = False
    try:
        while True:
            with m as source: 
                try:
                    audio = r.listen(source, timeout=3)
                    # recognize speech using Google Speech Recognition
                    value = r.recognize_bing(audio, key="8d58ac3096924631a8828c61ac612f8f")
                    if 'forward' in value.lower() or value[0].lower() == 'f':
                        intent = 1
                    elif 'back' in value.lower() or value[0].lower() == 'b':
                        intent = -1
                    else: 
                        intent = 0
                    glob_intent = intent
                    print(value)
                except sr.UnknownValueError:
                    print("Unknown Data")
                    intent = 0
                except sr.RequestError as e:
                    print("Couldn't process results; {0}".format(e))
                    intent = 0
                except Exception as e:
                    print(e)
    except KeyboardInterrupt:
        pass
