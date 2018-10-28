import datetime, time
import datetime, time
from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from itertools import tee

app = Flask(__name__)

app.config.from_object('config.default')
app.url_map.strict_slashes = False
app.url_map.strict_slashes = False

db = SQLAlchemy(app)

from models import Sensor, SensorData

@app.route("/", defaults={'timerange': 1})
@app.route("/<int:timerange>")
def index(timerange):
    sensors = Sensor.query.all()
    it1, it2 = tee(enumerate(sensors), 2)
    return render_template('index.html', isensors1=it1, isensors2=it2, slen = len(sensors))

@app.route("/data/<float:temp>/<float:hum>/<float:pres>/<string:pwd>", methods=['GET', 'POST'])
def data(temp, hum, pres, pwd):
    if pwd == app.config['PASS']:
        now = datetime.datetime.now()
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
