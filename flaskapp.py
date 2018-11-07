# -*- coding: utf-8 -*-

from bson.json_util import dumps, ObjectId
from flask import Flask, render_template, request, Response
from flask_compress import Compress
from flask_babel import Babel
import psycopg2
from psycopg2.extras import RealDictCursor


app = Flask(__name__)
# app.config.from_object(os.environ['APP_SETTINGS'])
app.config.from_object("config.Config")
Compress(app)

# Initialize Babel
babel = Babel(app)

@babel.localeselector
def get_locale():
    return request.accept_languages.best_match(app.config['LANGUAGES'].keys())


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


@app.route("/about_data")
def about_data():
    # Just plot a html page
    return render_template("about_data.html")


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
    try:
        cur.execute(query, (date/1e3,))
        data = cur.fetchall() # [ d[0] for d in cur.fetchall()]
        conn.close ()
        return Response(dumps(data), mimetype='application/json')
    except Exception as e:
        conn.close()
        print(e)
        return 500


if __name__ == "__main__":
    app.run()
