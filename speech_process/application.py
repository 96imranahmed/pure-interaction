from flask import Flask
import threading
from speech_process import speech_rec, glob_intent
app = Flask(__name__)

@app.route("/speech")
def proc():
    global glob_intent
    return str(glob_intent)

if __name__ == '__main__':
    t = threading.Thread(target=speech_rec)
    t.start()
    app.run()
