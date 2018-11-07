
import os
class Config(object):
    DEBUG = False
    TESTING = False
    CSRF_ENABLED = True
    SECRET_KEY = '\xfb!\x8eJ\xd3\xe9\x95$\x81\x7fin\xd2H\xfe\xef\x83,\xa9e\xfcD\x92\x19'
    SQLALCHEMY_DATABASE_URI = os.environ['SZCZECIN_DATABASE_URL']
    LANGUAGES = {
        'en': 'English',
        'pl': 'Polski'}
    BABEL_DEFAULT_LOCALE = 'en'


class ProductionConfig(Config):
    DEBUG = False


class StagingConfig(Config):
    DEVELOPMENT = True
    DEBUG = True


class DevelopmentConfig(Config):
    DEVELOPMENT = True
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
