/* Magic Mirror
 * Module: MMM-DHT-Sensor
 *
 * Magic Mirror By Michael Teeuw https://magicmirror.builders
 * MIT Licensed.
 *
 * Module MMM-DHT-Sensor By Grena https://github.com/grenagit
 * MIT Licensed.
 */

Module.register("MMM-DHT-Sensor", {

	// Default module config
	defaults: {
		sensorPin: 0,
		sensorType: 0, // 11 for DHT11 or 22 for DHT22 / AM2302
		units: config.units,
		updateInterval: 60 * 60 * 1000, // every 1 hour
		animationSpeed: 1000, // 1 second
		relativeScale: 30,
		roundTemp: false,

		initialLoadDelay: 0, // 0 second delay
		retryDelay: 2500, // 2,5 seconds
	},
	
	// Define required scripts
	getStyles: function() {
		return ["font-awesome.css"];
	},

	// Define start sequence
	start: function() {
		Log.info("Starting module: " + this.name);
	
		this.temperature = null;
		this.humidity = null;
		this.loaded = false;
		this.updateTimer = null;
		
		this.scheduleUpdate(this.config.initialLoadDelay);
	},

	// Override dom generator
	getDom: function() {
		var wrapper = document.createElement("div");
		
		if(this.config.sensorPin === 0) {
			wrapper.innerHTML = "Please set the <i>GPIO pin number</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if(this.config.sensorType === 0) {
			wrapper.innerHTML = "Please set the <i>sensor type</i> in the config for module: " + this.name + ".";
			wrapper.className = "small";
			return wrapper;
		}

		if(!this.loaded) {
			wrapper.innerHTML = this.translate("LOADING");
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		var medium = document.createElement("div");
		medium.className = "normal medium";
		
		var temperatureIcon = document.createElement("span");
		temperatureIcon.className = "fas " + this.temp2icon(this.temperature) + " dimmed";
		medium.appendChild(temperatureIcon);
		
		var temperatureValue = document.createElement("span");
		temperatureValue.innerHTML = " " + this.temperature + this.temperatureUnit;
		medium.appendChild(temperatureValue);
		
		var spacer = document.createElement("span");
		spacer.innerHTML = "&nbsp;";
		medium.appendChild(spacer);
		
		var humidityIcon = document.createElement("span");
		humidityIcon.className = "fas fa-tint dimmed";
		medium.appendChild(humidityIcon);
		
		var humidityValue = document.createElement("span");
		humidityValue.innerHTML = " " + this.humidity + "%";
		medium.appendChild(humidityValue);
		
		wrapper.appendChild(medium);
		
		return wrapper;
	},

	// Request new data from DHT Sensor with node_helper
	socketNotificationReceived: function(notification, payload) {
		if (notification === "STARTED") {
			this.updateDom(this.config.animationSpeed);
		} else if (notification === "ERROR") {
			Log.error(this.name + ": Do not received valid sensor data (" + payload + ").");
			this.scheduleUpdate(this.config.retryDelay);
		} else if (notification === "DATA") {
			this.processSensorData(payload);
		}
	},
	
	// Use the received data to set the various values before update DOM
	processSensorData: function(data) {
		
		if (!data || !data.humidity || typeof data.temperature === "undefined") {
			Log.error(this.name + ": Do not receive usable data.");
			return;
		}

		switch(this.config.units) {
			case "metric":
				this.temperature = this.roundValue(data.temperature);
				this.temperatureUnit = "&deg;C";
				break;
			case "imperial":
				this.temperature = this.roundValue((data.temperature * 1.8) + 32);
				this.temperatureUnit = "&deg;F";
				break;
		}
		
		this.humidity = parseFloat(data.humidity).toFixed(0);
		
		if(this.temperature) {
			this.sendNotification("INDOOR_TEMPERATURE", this.temperature);
		}
		
		if(this.humidity) {
			this.sendNotification("INDOOR_HUMIDITY", this.humidity);
		}
		
		this.loaded = true;
		this.updateDom(this.config.animationSpeed);
		this.scheduleUpdate();
	},
	
	// Schedule next update
	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
		  nextLoad = delay;
		}

		var self = this;
		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(function() {
		  self.sendSocketNotification('CONFIG', self.config);
		}, nextLoad);
	},
	
	// Round a temperature to 1 decimal or integer (depending on config.roundTemp)
	roundValue: function(temperature) {
		var decimals = this.config.roundTemp ? 0 : 1;
		return parseFloat(temperature).toFixed(decimals);
	},
	
	temp2icon: function(temperature) {
		var ratio = temperature / this.config.relativeScale;
	
		if(ratio < 0.25) {
			return 'fa-thermometer-empty';
		} else if(ratio < 0.5) {
			return 'fa-thermometer-quarter';
		} else if(ratio < 0.75) {
			return 'fa-thermometer-half';
		} else if(ratio < 1) {
			return 'fa-thermometer-three-quarters';
		} else {
			return 'fa-thermometer-full';
		}
	}

});
