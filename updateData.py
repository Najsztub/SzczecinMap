# -*- coding: utf-8 -*-
'''
MN: 03/10/16

Automation of database update.
Data taken from ScrapingHub
API key: c2cbde9622bc42629dee9ddba6ecd3fe
'''
# curl -u c2cbde9622bc42629dee9ddba6ecd3fe: https://storage.scrapinghub.com/activity/50402/?count=3


import sys
import time
import requests

API_key = 'c2cbde9622bc42629dee9ddba6ecd3fe'
PRJ = "50402"
URL = 'https://storage.scrapinghub.com/activity/%s/?count=3' % PRJ

r = requests.get(URL, auth=(API_key, ''))

# TODO: Get the most recent job number


def getSpider(url, api, **options):
    req = ''
    for idx, op in enumerate(options):
        if idx == 0:
            req += '?' + op + '=' + str(options[op])
        else:
            req += '&' + op + '=' + str(options[op])
    resp = requests.get(url + req, auth=(api, ''))
    return resp

# Get 5 most recent jobs
url_jobs = 'https://app.scrapinghub.com/api/jobs/list.json'
try:
    res_jobs = getSpider(url_jobs, API_key, project=PRJ, state='finished',
                         count=5)
except requests.HTTPError, ConnectionError:
    print "Connection Error!"
    sys.exit(1)
json_job = res_jobs.json()
# Find latest job
max_time = 0
max_time_id = -1
for idx, j in enumerate(json_job['jobs']):
    if j['close_reason'] != 'finished':
        continue
    job_end = time.mktime(
        time.strptime(
            str(j['updated_time']),
            '%Y-%m-%dT%H:%M:%S'
        )
    )
    if job_end >= max_time:
        max_time = job_end
        max_time_id = idx
last_job = json_job['jobs'][max_time_id]


