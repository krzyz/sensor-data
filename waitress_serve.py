from waitress import serve
import sensor_data
serve(sensor_data.app, host='0.0.0.0', port=8080)
