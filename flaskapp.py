import os
from flask import Flask
from flask import render_template
from flask import request
import pymongo

app = Flask(__name__)

#Create our index or root / route
@app.route("/")
@app.route("/index")
def index():
    return "This is the application mynote & I'm alive"

@app.route("/mongo/test")
def mongo_test():
    #setup the connection
    conn = pymongo.MongoClient(os.environ['OPENSHIFT_MONGODB_DB_URL'])
    db = conn.python
    
    #query the DB for all the parkpoints
    result = db.szczecin.count()
    return "There are %s data points in MongoDB base"%result

if __name__ == "__main__":
    app.run(debug = "True")
