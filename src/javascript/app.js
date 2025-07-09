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
      lastUpdated: document.getElementById('last-updated'),
      buttons: document.querySelectorAll('.forecast-control__btn'),
      forecastContent: document.querySelector('.forecast-content'),
      refreshBtn: document.querySelector('.refresh-btn')
    };
    this.init();
    this.renderPlaceholder();
    this.chooseCategory();
  }

  init() {
    this.elements.searchForm.addEventListener('submit', e => this.handleSearch(e));
    this.elements.refreshBtn.addEventListener('click', () => this.handleRefresh());
    // Set initial location and weather if available (e.g., from local storage or IP lookup)
    this.initialLoad();
  }

  async initialLoad() {
    // You could try to get user's current location here using navigator.geolocation
    // For now, let's set a default or prompt for a city
    const defaultCity = "Batumi"; // Example default city
    if (defaultCity) {
      this.elements.searchInput.value = defaultCity;
      await this.handleSearch(new Event('submit', { cancelable: true })); // Simulate search
    }
  }

  async handleSearch(e) {
    e.preventDefault();
    const city = this.elements.searchInput.value.trim();

    if (!city) return;

    try {
      this.cachedData = {}; // Clear cache on new city search
      const { current, coord, sys, name, main, weather, oneCallData } = await this.fetchWeather(city);
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
      this.updateLastUpdated();
      
      // Ensure the "Today" button is active after a new search
      this.elements.buttons.forEach(btn => btn.classList.remove('active'));
      const todayButton = Array.from(this.elements.buttons).find(btn => btn.textContent.trim() === 'Today');
      if (todayButton) {
        todayButton.classList.add('active');
      }
      
      this.loadCategoryData('Today', oneCallData); // Pass oneCallData for 'Today' category
    } catch (err) {
      console.error("Error in handleSearch:", err);
      alert(err.message || 'City not found!');
      await this.animateTransition(() => this.renderPlaceholder());
      this.elements.currentLocation.textContent = ''; // Clear location on error
      this.elements.lastUpdated.textContent = ''; // Clear updated time
      this.elements.forecastContent.innerHTML = ''; // Clear forecast content on error
    }
  }

  async handleRefresh() {
    if (!this.elements.searchInput.value.trim()) {
      alert("Please search for a city first.");
      return;
    }
    const currentCity = this.elements.searchInput.value.trim();
    if (currentCity) {
      this.cachedData = {}; // Clear cache to force fresh data
      await this.handleSearch(new Event('submit', { cancelable: true })); // Re-run search
    }
  }

  updateLastUpdated() {
    const now = new Date();
    this.elements.lastUpdated.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
        // Using optional chaining and nullish coalescing for safety
        pop: oneCallData.hourly?.[0]?.pop ?? null
      },
      coord: currentData.coord,
      sys: currentData.sys,
      name: currentData.name,
      main: currentData.main,
      weather: currentData.weather,
      oneCallData // Pass the full oneCallData for other categories
    };
  }

  async fetchHourlyForecast(lat, lon) {
    // Check if hourly data is already in oneCallData from initial fetchWeather
    if (this.cachedData.oneCallData && this.cachedData.oneCallData.hourly) {
      return this.cachedData.oneCallData.hourly;
    }
    
    // If not, fetch it specifically
    const res = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,daily,alerts&appid=${this.apiKey}&units=metric`
    );
    if (!res.ok) throw new Error('Failed to fetch hourly forecast');
    const data = await res.json();
    this.cachedData.hourly = data.hourly; // Cache separate hourly data if fetched
    return this.cachedData.hourly;
  }

  async fetchWeeklyForecast(lat, lon) {
    // Check if daily data is already in oneCallData from initial fetchWeather
    if (this.cachedData.oneCallData && this.cachedData.oneCallData.daily) {
      return this.cachedData.oneCallData.daily;
    }

    // If not, fetch it specifically
    const res = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,alerts&appid=${this.apiKey}&units=metric`
    );
    if (!res.ok) throw new Error('Failed to fetch weekly forecast');
    const data = await res.json();
    this.cachedData.weekly = data.daily; // Cache separate weekly data if fetched
    return this.cachedData.weekly;
  }
}

class WeatherAppUI extends WeatherApp {
  constructor (apiKey) {
    super(apiKey);
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
      visibility: visibility / 1000, // Convert meters to kilometers
      pressure: main.pressure
    });
  }

  renderPlaceholder() {
    this.renderTemplate({
      temp: '—',
      desc: 'Enter a city',
      icon: 'src/icons/cloud.svg', // A generic cloud icon
      feels: ' ',
      high: '—',
      low: '—',
      wind: '—',
      humidity: '—',
      visibility: '—',
      pressure: '—'
    });
    this.elements.currentLocation.textContent = 'Location, Country'; // Reset location placeholder
    this.elements.lastUpdated.textContent = ''; // Clear update time
    this.elements.forecastContent.innerHTML = ''; // Clear forecast content
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
      <h3>Sunrise & Sunset</h3>
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

  renderHourlyForecast(hourlyData) {
    let html = '<div class="hourly-forecast"><h3>48-Hour forecast</h3><div class="hourly-items">';

    hourlyData.slice(0, 24).forEach(hour => { // Display next 24 hours
      const time = new Date(hour.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
  
    html += '</div></div>'; // Close .hourly-items and .hourly-forecast
    return html;
  }
  

  renderWeeklyForecast(weeklyData) {
    let html = '<div class="weekly-forecast"><h3>Weekly Forecast</h3><div class="weekly-items">';

    weeklyData.slice(0, 7).forEach(day => { // Display next 7 days
      const date = new Date(day.dt * 1000).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
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

  async loadCategoryData(category, oneCallData = null) {
    if (!this.currentCoords) {
      this.elements.forecastContent.innerHTML = '<div class="info">Search for a city to see the forecast.</div>';
      return;
    }
    
    this.elements.forecastContent.innerHTML = '<div class="loading">Loading...</div>';

    try {
      let content = '';
      
      switch (category) {
        case 'Today':
          // If oneCallData is already passed from handleSearch, use it
          // Otherwise, fetch fresh data for 'Today' highlights
          const todayData = oneCallData || await this.fetchWeather(this.elements.searchInput.value.trim() || this.elements.currentLocation.textContent.split(',')[0].trim());
          console.log(todayData);
          content += this.loadSunriseSunset(todayData.sys.sunrise, todayData.sys.sunset);
          content += this.loadPrecipitation(todayData.main.humidity, todayData.current.pop);
          content += this.loadWindAndPressure(todayData.current.wind.speed, todayData.main.pressure);
          break;

        case 'Hourly':
          // Prioritize cached oneCallData if available from initial fetchWeather, otherwise fetch
          const hourlyData = oneCallData?.hourly || await this.fetchHourlyForecast(this.currentCoords.lat, this.currentCoords.lon);
          content += this.renderHourlyForecast(hourlyData);
          break;

        case 'Next 7 days':
          // Prioritize cached oneCallData if available from initial fetchWeather, otherwise fetch
          const weeklyData = oneCallData?.daily || await this.fetchWeeklyForecast(this.currentCoords.lat, this.currentCoords.lon);
          content = this.renderWeeklyForecast(weeklyData);
          break;

        case 'Next 14 days':
            // You would need to adjust the slice for daily data (e.g., .slice(0, 14))
            // The OpenWeatherMap One Call API provides up to 8 days of daily forecast.
            // For 14 or 30 days, you would need to use a different API (e.g., a commercial one)
            // or combine data from multiple sources/calls if supported.
            // For demonstration, we'll use the available daily data and note the limitation.
            const weeklyData14 = oneCallData?.daily || await this.fetchWeeklyForecast(this.currentCoords.lat, this.currentCoords.lon);
            content = this.renderWeeklyForecast(weeklyData14.slice(0, 14)); // Still limited to max 8 days from OWM One Call
            break;

        case 'Next 30 days':
            // Similar to 14 days, OpenWeatherMap One Call API does not provide 30-day forecast.
            // You'd need a different API for this.
            content = '<div class="info">30-day forecast data is not available through this API.</div>';
            break;

        default:
          console.warn('Unknown category:', category);
          content = '<div class="error">Unknown forecast category.</div>';
      }

      this.elements.forecastContent.innerHTML = content;
    } catch (err) {
      console.error('Failed to load category data:', err);
      this.elements.forecastContent.innerHTML = '<div class="error">Failed to load data for this category.</div>';
    }
  }

  chooseCategory() {
    this.elements.buttons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        this.elements.buttons.forEach(btn => btn.classList.remove('active'));
        // Add active class to the clicked button
        button.classList.add('active');
        
        // Load data only if a city has been successfully searched
        if (this.elements.currentLocation.textContent && this.currentCoords) {
          this.loadCategoryData(button.textContent.trim());
        } else {
          this.elements.forecastContent.innerHTML = '<div class="info">Please search for a city first.</div>';
        }
      });
    });
  }

  async animateTransition(renderFn) {
    const card = this.elements.weatherSection.querySelector('.weather-card');
    if (card) {
      card.classList.replace('fade-in', 'fade-out');
      await new Promise(resolve => setTimeout(resolve, 400)); // Match CSS transition duration
    }
    renderFn();
    const newCard = this.elements.weatherSection.querySelector('.weather-card');
    if (newCard) newCard.classList.replace('fade-out', 'fade-in');
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
              <div class="value">${wind}${typeof wind === 'number' ? ' km/h' : ''}</div>
            </div>
          </div>
          <div class="wind-pressure-item">
            <img src="src/icons/gauge.svg" width="24" height="24" class="pressure-icon" alt="Pressure Icon" />
            <div class="wind-pressure-info">
              <div class="label">Pressure</div>
              <div class="value">${pressure}${typeof pressure === 'number' ? ' hPa' : ''}</div>
            </div>
          </div>
        </div>
      </div>`;
  }
}

// Ensure the DOM is fully loaded before initializing the app
document.addEventListener('DOMContentLoaded', () => {
  // Replace 'YOUR_API_KEY_HERE' with your actual OpenWeatherMap API key
  const app = new WeatherAppUI('3894f2877ca26ffd99eeab17f4762833'); 
});