# About

## Data

The data has been gathered from [otodom.pl](https://otodom.pl), a Polish property selling website. I've used [Scrapy](http://scrapy.readthedocs.io/en/latest/) to automatically scrape all the ads for Szczecin. I scraped the adds every week between September 2016 and May 2018. There are some gaps due to improvement of anti-scraping mechanisms of the website. 

I do not claim ownership of the data. The data were publicly available in the internet. I've just gathered them together :-). The data and software comes as it is and I am not responsible for any harm done using it.

## Summary

The data have been are summarized on [my personal blog](https://maten.pl/post/szczecin-analysis/). Additional code for a simple analysis is available on my [Github](https://github.com/Najsztub/SzczecinHome) account.
 
## Usage

The map uses Bootstrap and D3.js. It also needs [Leaflet](http://leafletjs.com/) to draw maps coming from [Mapbox](https://www.mapbox.com/). The code uses my personal Mapbox token, so please use your own. The code uses Hexbin for plotting using code described [here](http://www.delimited.io/blog/2013/12/1/hexbins-with-d3-and-leaflet-maps). 

Everything is hosted on [DigitalOcean](https://www.digitalocean.com/) and is using Python and Flask. The website uses PostgreSQL as the default database and `psycopg2` as the default database engine.

In case of questions or problems don't hesitate to drop me a message.
