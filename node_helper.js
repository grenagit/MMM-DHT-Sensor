"use strict";

/* Magic Mirror
 * Module: MMM-DHT-Sensor
 *
 * Magic Mirror By Michael Teeuw https://magicmirror.builders
 * MIT Licensed.
 *
 * Module MMM-DHT-Sensor By Grena https://github.com/grenagit
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const sensor = require("node-dht-sensor");

module.exports = NodeHelper.create({

	readSensor: function() {
		var self = this;
		sensor.read(self.config.sensorType, self.config.sensorPin, function(err, temperature, humidity) {
			if(!err) {
				self.sendSocketNotification("DATA", {
					temperature: temperature,
					humidity: humidity,
				});
			} else {
				self.sendSocketNotification("ERROR", err);
			}
		});
	},

	socketNotificationReceived: function(notification, payload) {
		var self = this;
		if (notification === 'CONFIG') {
			self.config = payload;
			self.sendSocketNotification("STARTED", true);
			self.readSensor();
		}
	}
	
});
