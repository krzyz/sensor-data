import time
from datetime import date, datetime, timedelta
from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import and_
from sqlalchemy.sql import select
from sqlalchemy.orm import contains_eager
from itertools import tee

app = Flask(__name__,template_folder="./dist/templates",static_folder="./dist/static")

app.config.from_object('config.default')
app.url_map.strict_slashes = False
app.url_map.strict_slashes = False

db = SQLAlchemy(app)

from models import Sensor, SensorData

@app.route("/", defaults={'timerange': 24})
@app.route("/<int:timerange>")
def index(timerange):
    upper = datetime.now()
    then = date.min
    if timerange > 0:
        then = upper - timedelta(hours=timerange)
    #sensors = Sensor.query.all()
    #sensors = Sensor.query.filter(SensorData.date >= time.mktime(then.timetuple()) , SensorData.date <= time.mktime(now.timetuple())).all()
    #sensors = Sensor.query.filter(SensorData.date.between(then, now)).all()
    #sensors = Sensor.query.join(SensorData, Sensor.data).filter(SensorData.date.between(then, now)).all()

    #sensors = db.session.query(Sensor).join(SensorData, and_(Sensor.id == SensorData.sensor_id, SensorData.date > then)).options(contains_eager(Sensor.data)).all()
    #sensors = db.session.query(Sensor).join(Sensor.data).options(contains_eager(Sensor.data)).filter(SensorData.date > then).all()
    #sensors = db.session.query(Sensor).join(Sensor.data).options(contains_eager(Sensor.data)).filter(SensorData.date.between(then, now)).all()
    sensors = Sensor.query.join(Sensor.data).options(contains_eager(Sensor.data)).filter(SensorData.date.between(time.mktime(then.timetuple()), time.mktime(upper.timetuple()))).all()
    #sensors = Sensor.query.all()
    #sensorData = {}
    #for sensor in sensors:
    #    sensorData[sensor.id] = sensor.data.limit(100).all()
    #with open('test', 'w') as sfile:
    #    sfile.write('%s\n' % then)
    #    sfile.write('%s\n' % upper)
    #    for sensor in sensors:
    #        for point in sensor.data:
    #            sfile.write('%s\n' % datetime.fromtimestamp(point.date))

#    with open('test', 'w') as sfile:
#        sfile.write('%s\n' % then)
#        sfile.write('%s\n' % now)
#        for (i, data) in sensorData.items():
#            for point in data:
#                sfile.write('%s\n' % datetime.fromtimestamp(point.date))

    #it1, it2 = tee(enumerate(sensors), 2)
    #return render_template('index.html', isensors1=it1, isensors2=it2, slen = len(sensors))
    return render_template('index.html', sensors=sensors)

@app.route("/data/<float:temp>/<float:hum>/<float:pres>/<string:pwd>", methods=['GET', 'POST'])
def data(temp, hum, pres, pwd):
    if pwd == app.config['PASS']:
        now = datetime.now()
        sensor_names = ['temp', 'hum', 'pres']
        sensor_units = ['°C', '%', 'hPa']
        values = [temp, hum, pres]

        for (sensor_name, unit, value) in zip(sensor_names, sensor_units, values):
            sensor = Sensor.query.filter_by(name = sensor_name).first()
            if sensor is None:
                sensor = Sensor(name = sensor_name, unit = unit)
                db.session.add(sensor)
                db.session.commit()

            data = SensorData(date = time.mktime(now.timetuple()), value = value)
            sensor.data.append(data)
            db.session.add(data)
            db.session.commit()
    sensors = Sensor.query.all()
    return render_template('index.html', isensors=enumerate(sensors), slen = len(sensors))

@app.before_first_request
def create_tables():
    db.create_all()

if __name__ == "__main__":
    app.run(host='0.0.0.0')
