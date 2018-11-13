import time
from datetime import date, datetime, timedelta
from flask import Flask, render_template, redirect
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
    then = datetime(2000, 1, 1)
    if timerange > 0:
        then = upper - timedelta(hours=timerange)
    sensors = Sensor.query.join(Sensor.data).options(contains_eager(Sensor.data)).filter(SensorData.date.between(time.mktime(then.timetuple()), time.mktime(upper.timetuple()))).all()
    return render_template('index.html', sensors=sensors)

@app.route("/data/<float:temp>/<float:hum>/<float:pres>/<float:pm2_5>/<float:pm10>/<string:pwd>", methods=['GET', 'POST'])
def data(temp, hum, pres, pm2_5, pm10, pwd):
    if pwd == app.config['PASS']:
        now = datetime.now()
        sensor_names = ['temp', 'hum', 'pres', 'PM 2.5', 'PM 10']
        sensor_units = ['°C', '%', 'hPa', 'μg /m³', 'μg /m³']
        values = [temp, hum, pres, pm2_5, pm10]

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
    return redirect("/", code=303)

@app.before_first_request
def create_tables():
    db.create_all()

if __name__ == "__main__":
    app.run(host='0.0.0.0')
