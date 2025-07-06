class WeatherApp {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.elements = {
      searchForm: document.querySelector('.search-form'),
      searchInput: document.querySelector('.search-form input'),
      weatherSection: document.querySelector('.weather-section'),
      currentLocation: document.querySelector('.current-location')
    };
    this.init();
    this.renderPlaceholder();
  }

  init() {
    this.elements.searchForm.addEventListener('submit', e => this.handleSearch(e));
  }

  async handleSearch(e) {
    e.preventDefault();
    const city = this.elements.searchInput.value.trim();
    if (!city) return;
    
    try {
      const data = await this.fetchWeather(city);
      await this.animateTransition(() => this.renderWeather(data));
      this.elements.currentLocation.textContent = `${data.name}, ${data.sys.country}`;
    } catch (err) {
      alert(err.message || 'City not found!');
      await this.animateTransition(() => this.renderPlaceholder());
    }
  }

  async fetchWeather(city) {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`
    );
    if (!response.ok) throw new Error('City not found');
    return response.json();
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
  new WeatherApp('3894f2877ca26ffd99eeab17f4762833');
});