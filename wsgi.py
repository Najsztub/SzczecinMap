#!/usr/bin/python3                                                              
activate_this = '/var/opt/p3flask/bin/activate_this.py'
with open(activate_this) as file_:
    exec(file_.read(), dict(__file__=activate_this))
import sys
import logging
logging.basicConfig(stream=sys.stderr)
sys.path.insert(0,"/var/www/map/")

from flaskapp import app as application
application.secret_key = '\xfb!\x8eJ\xd3\xe9\x95$\x81\x7fin\xd2H\xfe\xef\x83,\xa9e\xfcD\x92\x19'
