# -*- coding: utf-8 -*-
import os
from flask import Flask
from flask import render_template
from flask import request
from flask import jsonify
from flask import Response
from flask import send_from_directory
from bson.json_util import dumps
import pymongo

app = Flask(__name__)

#Create our index or root / route
@app.route("/")
@app.route("/index")
def index():
    return "This is the application & I'm alive"

@app.route("/mongo/data")
def mongo_data():
    #setup the connection
    conn = pymongo.MongoClient(os.environ['OPENSHIFT_MONGODB_DB_URL'])
    db = conn.python
    
    #query the DB for all the coordinates
    coords = db.szczecin.find({'town':'Szczecin',
                               'data_lat': {'$gt': 0.0 , "$lt": 54.0 },
                               'data_lon': {'$gt': 14.0 , '$lt': 15.0 } },
                              {'data_lat': 1, 'data_lon': 1,
                               'price':1, 'pow':1, '_id':1})
    #json_coords = [dumps(c) for c in coords]
    return Response(
        dumps(coords),
        mimetype='application/json'
    )

@app.route("/mongo/html")
def mongo_html():
    # Just plot a html page
    return render_template("mongo_html.html")

@app.route("/mongo/map")
def mongo_map():
    # Just plot a html page
    return render_template("mongo_leaf.html")


if __name__ == "__main__":
    app.run(debug = "True")
