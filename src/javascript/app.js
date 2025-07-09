class WeatherApp {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.cachedData = {};
    this.currentCoords = null;
    this.elements = {
      searchForm: document.querySelector('.search-form'),
      searchInput: document.querySelector('.search-form input'),
      weatherSection: document.querySelector('.weather-section'),
      currentLocation: document.querySelector('.current-location'),
      buttons: document.querySelectorAll('.forecast-control__btn'),
      forecastContent: document.querySelector('.forecast-content')
    };
    this.init();
    this.renderPlaceholder();
    this.chooseCategory();
  }

  init() {
    this.elements.searchForm.addEventListener('submit', e => this.handleSearch(e));
  }

  async handleSearch(e) {
    e.preventDefault();
    const city = this.elements.searchInput.value.trim();

    if (!city) return;

    try {
      this.cachedData = {};
      const { current, coord, sys, name, main, weather } = await this.fetchWeather(city);
      this.currentCoords = coord;
      
      await this.animateTransition(() => this.renderWeather({ 
        weather, 
        main, 
        wind: current.wind, 
        visibility: current.visibility, 
        sys, 
        name 
      }));
      
      this.elements.currentLocation.textContent = `${name}, ${sys.country}`;
      
      const activeButton = Array.from(this.elements.buttons).find(btn => 
        btn.classList.contains('active')
      ) || this.elements.buttons[0];
      
      this.loadCategoryData(activeButton.textContent.trim());
    } catch (err) {
      alert(err.message || 'City not found!');
      await this.animateTransition(() => this.renderPlaceholder());
    }
  }

  async fetchWeather(city) {
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`
    );
    if (!currentRes.ok) throw new Error('City not found');
    const currentData = await currentRes.json();
    const { lat, lon } = currentData.coord;

    const oneCallRes = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&appid=${this.apiKey}&units=metric`
    );
    if (!oneCallRes.ok) throw new Error('Failed to fetch detailed forecast');
    const oneCallData = await oneCallRes.json();

    return {
      current: {
        wind: currentData.wind,
        visibility: currentData.visibility,
        pop: oneCallData.hourly?.[0]?.pop ?? null
      },
      coord: currentData.coord,
      sys: currentData.sys,
      name: currentData.name,
      main: currentData.main,
      weather: currentData.weather,
      oneCallData 
    };
  }

  async fetchHourlyForecast(lat, lon) {
    if (this.cachedData.hourly) return this.cachedData.hourly;
    
    const res = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,daily,alerts&appid=${this.apiKey}&units=metric`
    );
    if (!res.ok) throw new Error('Failed to fetch hourly forecast');
    const data = await res.json();
    this.cachedData.hourly = data.hourly;
    return this.cachedData.hourly;
  }

  async fetchWeeklyForecast(lat, lon) {
    if (this.cachedData.weekly) return this.cachedData.weekly;
    
    const res = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,alerts&appid=${this.apiKey}&units=metric`
    );
    if (!res.ok) throw new Error('Failed to fetch weekly forecast');
    const data = await res.json();
    this.cachedData.weekly = data.daily;
    return this.cachedData.weekly;
  }

  renderWeather({ weather: [w], main, wind, visibility, sys, name }) {
    this.renderTemplate({
      temp: Math.round(main.temp),
      desc: w.description,
      icon: `https://openweathermap.org/img/wn/${w.icon}@4x.png`,
      feels: Math.round(main.feels_like),
      high: Math.round(main.temp_max),
      low: Math.round(main.temp_min),
      wind: wind.speed,
      humidity: main.humidity,
      visibility: visibility / 1000,
      pressure: main.pressure
    });
  }

  renderPlaceholder() {
    this.renderTemplate({
      temp: '—',
      desc: 'Enter a city',
      icon: 'src/icons/cloud.svg',
      feels: ' ',
      high: '—',
      low: '—',
      wind: '—',
      humidity: '—',
      visibility: '—',
      pressure: '—'
    });
  }

  renderTemplate(data) {
    this.elements.weatherSection.innerHTML = `
      <div class="container">
        <div class="weather-card fade-in">
          <div class="weather-card__content">
            <div class="weather-card__main">
              <div class="weather-card__icon-temp">
                <img src="${data.icon}" width="64" height="64" class="weather-card__icon" alt="${data.desc}" />
                <div>
                  <p class="weather-card__temp">${data.temp}${typeof data.temp === 'number' ? '°C' : ''}</p>
                  <p class="weather-card__desc">${data.desc}</p>
                </div>
              </div>
              <p class="weather-card__feels">${typeof data.feels === 'number' ? `Feels like ${data.feels}°C` : data.feels}</p>
              <div class="weather-card__hl">
                <span>H: ${data.high}${typeof data.high === 'number' ? '°' : ''}</span>
                <span>L: ${data.low}${typeof data.low === 'number' ? '°' : ''}</span>
              </div>
            </div>
            <div class="weather-card__details">
              ${this.renderDetail('wind', 'Wind', `${data.wind}${typeof data.wind === 'number' ? ' km/h' : ''}`)}
              ${this.renderDetail('droplets', 'Humidity', `${data.humidity}${typeof data.humidity === 'number' ? '%' : ''}`)}
              ${this.renderDetail('eye', 'Visibility', `${data.visibility}${typeof data.visibility === 'number' ? ' km' : ''}`)}
              ${this.renderDetail('thermometer', 'Pressure', `${data.pressure}${typeof data.pressure === 'number' ? ' hPa' : ''}`)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderDetail(icon, label, value) {
    return `
      <div class="weather-detail">
        <img src="src/icons/${icon}.svg" width="24" height="24" class="lucide lucide-${icon} weather-detail__icon" alt="${label}" />
        <p class="weather-detail__label">${label}</p>
        <p class="weather-detail__value">${value}</p>
      </div>
    `;
  }

  loadSunriseSunset(sunrise, sunset) {
    return `
    <div class="sun-moon-card">
      <h3>Today's Highlights</h3>
      <div class="sun-moon-details">
        <div class="sun-moon-detail">
          <img src="src/icons/sunrise.svg" width="24" height="24" alt="Sunrise" />
          <div>
            <p>Sunrise:</p>
            <p>${new Date(sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
        <div class="sun-moon-detail">
          <img src="src/icons/sunset.svg" width="24" height="24" alt="Sunset" />
          <div>
            <p>Sunset:</p>
            <p>${new Date(sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>
    </div>`;
  }

  loadPrecipitation(humidity, pop) {
    const chance = pop !== null ? `${Math.round(pop * 100)}%` : '—';
    return `<div class="precipitation-card">
      <h3>Precipitation</h3>
      <div class="precipitation-details">
        <div class="precipitation-item">
          <img src="src/icons/precipitation.svg" width="24" height="24" class="precipitation-icon" alt="Precipitation Icon" />
          <div class="precipitation-info">
            <div class="label">Chance of Rain</div>
            <div class="value">${chance}</div>
          </div>
        </div>
        <div class="precipitation-item">
          <img src="src/icons/humidity.svg" width="24" height="24" class="humidity-icon" alt="Humidity Icon" />
          <div class="precipitation-info">
            <div class="label">Humidity</div>
            <div class="value">${humidity}%</div>
          </div>
        </div>
      </div>
    </div>`;
  }

  loadWindAndPressure(wind, pressure) {
    return `
      <div class="wind-pressure-card">
        <h3>Wind & Pressure</h3>
        <div class="wind-pressure-details">
          <div class="wind-pressure-item">
            <img src="src/icons/wind-pressure.svg" width="24" height="24" class="wind-icon" alt="Wind Icon" />
            <div class="wind-pressure-info">
              <div class="label">Wind Speed</div>
              <div class="value">${wind} km/h</div>
            </div>
          </div>
          <div class="wind-pressure-item">
            <div class="pressure-icon">
              <div class="pressure-dot"></div>
            </div>
            <div class="wind-pressure-info">
              <div class="label">Pressure</div>
              <div class="value">${pressure} hPa</div>
            </div>
          </div>
        </div>
      </div>`;
  }

  renderHourlyForecast(hourlyData) {
    let html = '<div class="hourly-forecast"><h3>Hourly Forecast</h3><div class="hourly-items">';

    hourlyData.slice(0, 24).forEach(hour => {
      const time = new Date(hour.dt * 1000).toLocaleTimeString([], { hour: '2-digit' });
      const temp = Math.round(hour.temp);
      const icon = `https://openweathermap.org/img/wn/${hour.weather[0].icon}.png`;
      const pop = hour.pop ? `${Math.round(hour.pop * 100)}%` : '0%';

      html += `
        <div class="hourly-item">
          <span class="hourly-time">${time}</span>
          <img src="${icon}" alt="${hour.weather[0].description}" />
          <span class="hourly-temp">${temp}°C</span>
          <span class="hourly-pop">${pop}</span>
        </div>
      `;
    });

    html += '</div></div>';
    return html;
  }

  renderWeeklyForecast(weeklyData) {
    let html = '<div class="weekly-forecast"><h3>Weekly Forecast</h3><div class="weekly-items">';

    weeklyData.slice(0, 7).forEach(day => {
      const date = new Date(day.dt * 1000).toLocaleDateString([], { weekday: 'short' });
      const maxTemp = Math.round(day.temp.max);
      const minTemp = Math.round(day.temp.min);
      const icon = `https://openweathermap.org/img/wn/${day.weather[0].icon}.png`;
      const pop = day.pop ? `${Math.round(day.pop * 100)}%` : '0%';

      html += `
        <div class="weekly-item">
          <span class="weekly-day">${date}</span>
          <img src="${icon}" alt="${day.weather[0].description}" />
          <div class="weekly-temps">
            <span class="weekly-max">${maxTemp}°</span>
            <span class="weekly-min">${minTemp}°</span>
          </div>
          <span class="weekly-pop">${pop}</span>
        </div>
      `;
    });

    html += '</div></div>';
    return html;
  }

  async loadCategoryData(category) {
    if (!this.currentCoords) return;
    
    this.elements.forecastContent.innerHTML = '<div class="loading">Loading...</div>';

    try {
      let content = '';
      
      switch (category) {
        case 'Today':
          const weatherData = await this.fetchWeather(this.elements.currentLocation.textContent.split(',')[0].trim());
          content += this.loadSunriseSunset(weatherData.sys.sunrise, weatherData.sys.sunset);
          content += this.loadPrecipitation(weatherData.main.humidity, weatherData.current.pop);
          content += this.loadWindAndPressure(weatherData.current.wind.speed, weatherData.main.pressure);
          break;

        case 'Hourly':
          const hourlyData = await this.fetchHourlyForecast(this.currentCoords.lat, this.currentCoords.lon);
          content = this.renderHourlyForecast(hourlyData);
          break;

        case 'Week':
          const weeklyData = await this.fetchWeeklyForecast(this.currentCoords.lat, this.currentCoords.lon);
          content = this.renderWeeklyForecast(weeklyData);
          break;

        default:
          console.warn('Unknown category:', category);
      }

      this.elements.forecastContent.innerHTML = content;
    } catch (err) {
      console.error('Failed to load category data:', err);
      this.elements.forecastContent.innerHTML = '<div class="error">Failed to load data</div>';
    }
  }

  chooseCategory() {
    this.elements.buttons.forEach(button => {
      button.addEventListener('click', () => {
        this.elements.buttons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        if (this.elements.currentLocation.textContent) {
          this.loadCategoryData(button.textContent.trim());
        }
      });
    });
  }

  async animateTransition(renderFn) {
    const card = this.elements.weatherSection.querySelector('.weather-card');
    if (card) {
      card.classList.replace('fade-in', 'fade-out');
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    renderFn();
    const newCard = this.elements.weatherSection.querySelector('.weather-card');
    if (newCard) newCard.classList.replace('fade-out', 'fade-in');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new WeatherApp('3894f2877ca26ffd99eeab17f4762833');
});