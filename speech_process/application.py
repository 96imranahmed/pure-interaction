from flask import Flask
import threading
from speech_process import speech_rec, glob_intent
app = Flask(__name__)
reaction = ""

@app.route("/speech")
def proc():
    global glob_intent
    return str(glob_intent)

@app.route("/reaction")
def reac():
	global reaction
	reaction_copy = str(reaction)
	reaction = ""
	return reaction_copy

@app.route("/reaction/<query>")
def reac_update(query):
	global reaction
	reaction = query
	return str(reaction)

if __name__ == '__main__':
    t = threading.Thread(target=speech_rec)
    t.start()
    app.run()

