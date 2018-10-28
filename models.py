from sensor_data import db

class Sensor(db.Model):
    __tablename__ = 'sensor'

    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(50), unique = True, nullable = False)
    unit = db.Column(db.String(50))
    data = db.relationship('SensorData', backref='sensor')

class SensorData(db.Model):
    __tablename__ = 'sensordata'

    id = db.Column(db.Integer, primary_key = True)
    date = db.Column(db.Integer, nullable = False)
    value = db.Column(db.Float, nullable = False)
    sensor_id = db.Column(db.Integer, db.ForeignKey('sensor.id'), nullable = False)
