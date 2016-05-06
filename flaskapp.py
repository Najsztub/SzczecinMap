# -*- coding: utf-8 -*-
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

@app.route("/mongo/test", methods = ['GET', 'POST'])
def mongo_test():
    #setup the connection
    conn = pymongo.MongoClient(os.environ['OPENSHIFT_MONGODB_DB_URL'])
    db = conn.python
    
    #query the DB for all the parkpoints
    obsNum = db.szczecin.count()
    obs = db.szczecin.find().limit(1)
    outstr = ""
    for k in obs[0]:
        outstr += "%s,\t %s\n"%(k, obs[0][k])
    
    
    info = {"num": obsNum,
            "content": outstr
            }
    
    return render_template("mongo_test.html", info = info)

if __name__ == "__main__":
    app.run(debug = "True")
