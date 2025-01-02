class WeatherWidget extends Widget {
    constructor(config) {
        super(config);
        this.type = 'weather';
        this.settings = {
            location: 'London,UK',
            units: 'metric',
            color: '#2ec4b6',
            apiKey: 'c73f67eceb074b5d0cec67f86cbe8230',
            textSize: 'medium',
            display: {
                locationName: true,
                weatherIcon: true,
                temperature: true,
                description: true,
                humidity: true,
                feelsLike: true
            },
            ...config.settings
        };
        this.weatherData = null;
        this.updateInterval = null;
    }

    getIcon() {
        return '<i class="fas fa-cloud-sun"></i>';
    }

    render() {
        if (!this.weatherData) {
            return this.renderLoading();
        }
        return this.renderWeather();
    }

    renderLoading() {
        return `<div class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>`;
    }

    renderWeather() {
        const { main, weather, name } = this.weatherData;
        const temp = Math.round(main.temp);
        const icon = weather[0].icon;
        const description = weather[0].description;
        const { display } = this.settings;

        return `
            <div class="weather-content" data-size="${this.settings.textSize}" style="color: ${this.settings.color}">
                ${display.locationName ? `<div class="location">${name}</div>` : ''}
                <div class="weather-main">
                    ${display.weatherIcon ? `<img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">` : ''}
                    ${display.temperature ? `<div class="temperature">${temp}°${this.settings.units === 'metric' ? 'C' : 'F'}</div>` : ''}
                </div>
                ${display.description ? `<div class="description">${description}</div>` : ''}
                <div class="details">
                    ${display.humidity ? `<div>Humidity: ${main.humidity}%</div>` : ''}
                    ${display.feelsLike ? `<div>Feels like: ${Math.round(main.feels_like)}°</div>` : ''}
                </div>
            </div>
        `;
    }

    onInitialize($widget) {
        this.setupWeatherUpdates();
    }

    onDestroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }

    setupWeatherUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.fetchWeatherData();
        this.updateInterval = setInterval(() => {
            this.fetchWeatherData();
        }, 30 * 60 * 1000);
    }

    async fetchWeatherData() {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${this.settings.location}&units=${this.settings.units}&appid=${this.settings.apiKey}`
            );
            
            if (!response.ok) {
                throw new Error('Weather data fetch failed');
            }

            this.weatherData = await response.json();
            const $widget = $(`#widget-${this.id}`);
            if ($widget.length) {
                $widget.find('.widget-content').html(this.render());
            }
        } catch (error) {
            console.error('Error fetching weather:', error);
        }
    }

    openSettings() {
        console.log('Opening weather settings...'); // Debug line

        Swal.fire({
            title: 'Weather Settings',
            html: `
                <div class="mb-3">
                    <label class="form-label">Location</label>
                    <input type="text" id="location" class="form-control" 
                           value="${this.settings.location}" placeholder="City,Country">
                </div>
                <div class="mb-3">
                    <label class="form-label">Units</label>
                    <select id="units" class="form-select">
                        <option value="metric" ${this.settings.units === 'metric' ? 'selected' : ''}>Celsius</option>
                        <option value="imperial" ${this.settings.units === 'imperial' ? 'selected' : ''}>Fahrenheit</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">Text Size</label>
                    <select id="textSize" class="form-select">
                        <option value="small" ${this.settings.textSize === 'small' ? 'selected' : ''}>Small</option>
                        <option value="medium" ${this.settings.textSize === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="large" ${this.settings.textSize === 'large' ? 'selected' : ''}>Large</option>
                        <option value="x-large" ${this.settings.textSize === 'x-large' ? 'selected' : ''}>Extra Large</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">Color</label>
                    <input type="color" class="form-control form-control-color" 
                           id="weatherColor" value="${this.settings.color}">
                </div>
                <div class="mb-3">
                    <label class="form-label">Display Options</label>
                    <div class="display-options">
                        <div class="form-check">
                            <input type="checkbox" class="form-check-input" id="show-location" 
                                   ${this.settings.display.locationName ? 'checked' : ''}>
                            <label class="form-check-label" for="show-location">Location Name</label>
                        </div>
                        <div class="form-check">
                            <input type="checkbox" class="form-check-input" id="show-icon" 
                                   ${this.settings.display.weatherIcon ? 'checked' : ''}>
                            <label class="form-check-label" for="show-icon">Weather Icon</label>
                        </div>
                        <div class="form-check">
                            <input type="checkbox" class="form-check-input" id="show-temp" 
                                   ${this.settings.display.temperature ? 'checked' : ''}>
                            <label class="form-check-label" for="show-temp">Temperature</label>
                        </div>
                        <div class="form-check">
                            <input type="checkbox" class="form-check-input" id="show-desc" 
                                   ${this.settings.display.description ? 'checked' : ''}>
                            <label class="form-check-label" for="show-desc">Description</label>
                        </div>
                        <div class="form-check">
                            <input type="checkbox" class="form-check-input" id="show-humidity" 
                                   ${this.settings.display.humidity ? 'checked' : ''}>
                            <label class="form-check-label" for="show-humidity">Humidity</label>
                        </div>
                        <div class="form-check">
                            <input type="checkbox" class="form-check-input" id="show-feels" 
                                   ${this.settings.display.feelsLike ? 'checked' : ''}>
                            <label class="form-check-label" for="show-feels">Feels Like</label>
                        </div>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Save',
            preConfirm: () => {
                return {
                    location: document.getElementById('location').value,
                    units: document.getElementById('units').value,
                    textSize: document.getElementById('textSize').value,
                    color: document.getElementById('weatherColor').value,
                    apiKey: this.settings.apiKey,
                    display: {
                        locationName: document.getElementById('show-location').checked,
                        weatherIcon: document.getElementById('show-icon').checked,
                        temperature: document.getElementById('show-temp').checked,
                        description: document.getElementById('show-desc').checked,
                        humidity: document.getElementById('show-humidity').checked,
                        feelsLike: document.getElementById('show-feels').checked
                    }
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.settings = result.value;
                const $widget = $(`#widget-${this.id}`);
                this.fetchWeatherData().then(() => {
                    $widget.find('.widget-content').html(this.render());
                    this.save();
                });
            }
        });
    }

    renderWidget() {
        const style = `left: ${this.position.left}px; 
                      top: ${this.position.top}px; 
                      width: ${this.position.width}px; 
                      height: ${this.position.height}px;`;

        return `
            <div id="widget-${this.id}" class="widget ${this.type}-widget" style="${style}">
                <div class="widget-header d-flex justify-content-between align-items-center weather-header">
                    <span>${this.getIcon()}</span>
                    <div class="widget-controls">
                        <button class="btn btn-sm btn-link widget-settings">
                            <i class="fas fa-cog"></i>
                        </button>
                        <button class="btn btn-sm btn-link widget-remove">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="widget-content">
                    ${this.render()}
                </div>
            </div>
        `;
    }
} 