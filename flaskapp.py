# -*- coding: utf-8 -*-
import os

import pymongo
from bson.json_util import dumps, ObjectId
from flask import Flask, render_template, request, Response
from flask_compress import Compress

app = Flask(__name__)
Compress(app)

#Create our index or root / route
@app.route("/")
@app.route("/index")
def mongo_map():
    # Just plot a html page
    return render_template("mongo_leaf.html")

@app.route("/mongo/data")
def mongo_data():
    #setup the connection os.environ['OPENSHIFT_MONGODB_DB_URL'])
    key = "mongodb://localhost:27017/test"
    conn = pymongo.MongoClient(key)
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

@app.route('/mongo/item', methods=['GET', 'POST'])
def add_message():
    content = request.json
    #print content

    # Construct MongoDB query
    try:
        qu = [ObjectId(el['$oid']) for el in content]
    except TypeError:
        return "Error; none or invalid query given", 500
    #setup the connection
    key = "mongodb://localhost:27017/test"
    conn = pymongo.MongoClient(key)

    #conn = pymongo.MongoClient(os.environ['OPENSHIFT_MONGODB_DB_URL'])
    db = conn.python

    items = db.szczecin.find({'_id':{'$in': qu }}).limit(50)
    return Response(dumps(items), mimetype='application/json')

if __name__ == "__main__":
    app.run(debug = "False")
