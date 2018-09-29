# -*- coding: utf-8 -*-

import pymongo
from bson.json_util import dumps, ObjectId
from flask import Flask, render_template, request, Response
from flask_compress import Compress
import psycopg2
from psycopg2.extras import RealDictCursor


app = Flask(__name__)
# app.config.from_object(os.environ['APP_SETTINGS'])
app.config.from_object("config.Config")
Compress(app)

# Create our index or root / route
@app.route("/")
@app.route("/index")
def mongo_map():
    # Just plot a html page
    return render_template("map.html")


@app.route("/about")
def about_page():
    # Just plot a html page
    return render_template("about.html")


@app.route("/mongo/data")
def mongo_data():
    # setup the connection os.environ['OPENSHIFT_MONGODB_DB_URL'])
    key = "mongodb://localhost:27017/test"
    conn = pymongo.MongoClient(key)
    db = conn.python

    # query the DB for all the coordinates
    coords = db.szczecin.find({'town': 'Szczecin',
                               'data_lat': {'$gt': 0.0, "$lt": 54.0},
                               'data_lon': {'$gt': 14.0, '$lt': 15.0}},
                              {'data_lat': 1, 'data_lon': 1,
                               'price': 1, 'pow': 1, '_id': 1})
    # json_coords = [dumps(c) for c in coords]
    conn.close()
    return Response(
        dumps(coords),
        mimetype='application/json'
    )


@app.route('/mongo/item', methods=['GET', 'POST'])
def add_message():
    content = request.json
    # print content

    # Construct MongoDB query
    try:
        qu = [ObjectId(el['$oid']) for el in content]
    except TypeError:
        return "Error; none or invalid query given", 500
    # setup the connection
    key = "mongodb://localhost:27017/test"
    conn = pymongo.MongoClient(key)

    # conn = pymongo.MongoClient(os.environ['OPENSHIFT_MONGODB_DB_URL'])
    db = conn.python

    items = db.szczecin.find({'_id': {'$in': qu}}).limit(50)
    conn.close()
    return Response(dumps(items), mimetype='application/json')


@app.route('/dates')
def get_dates():
    conn = psycopg2.connect(app.config['SQLALCHEMY_DATABASE_URI'])
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""SELECT distinct date from dates order by date desc;""")
        rows = [t['date'] for t in cur.fetchall()]
        conn.close ()
        return Response(dumps(rows), mimetype='application/json')
    except Exception as e:
        conn.close ()
        print(e)
        return 500

@app.route('/date/<int:date>')
def get_date(date):
    conn = psycopg2.connect(app.config['SQLALCHEMY_DATABASE_URI'])
    cur = conn.cursor(cursor_factory=RealDictCursor)
    query = """
        SELECT a.id, price, pow, data_lat, data_lon
            from adds a
        inner join dates d
        on a.id = d.add_id
            where d.date = to_timestamp(%s)::date;
    """
    cur.execute(query, (date/1e3,))
    data = cur.fetchall() # [ d[0] for d in cur.fetchall()]
    conn.close ()
    return Response(dumps(data), mimetype='application/json')


if __name__ == "__main__":
    app.run()
