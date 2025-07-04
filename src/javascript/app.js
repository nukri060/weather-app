class WeatherApp {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.searchForm = document.querySelector('.search-form');
    this.searchInput = this.searchForm.querySelector('input');
    this.weatherSection = document.querySelector('.weather-section');
    this.currentLocation = document.querySelector('.current-location');
    this.init();
    this.renderPlaceholder();
  }

  init() {
    this.searchForm.addEventListener('submit', (e) => this.handleSearch(e));
  }

  async handleSearch(e) {
    e.preventDefault();
    const city = this.searchInput.value.trim();
    if (!city) return;
    try {
      const data = await this.fetchWeather(city);
      await this.animateCardTransition(() => this.renderWeather(data));
      this.updateLocation(data);
    } catch (err) {
      this.handleError(err);
      await this.animateCardTransition(() => this.renderPlaceholder());
    }
  }

  async fetchWeather(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('City not found');
    return response.json();
  }

  renderWeather(data) {
    const owmIcon = data.weather[0].icon;
    const owmIconUrl = `https://openweathermap.org/img/wn/${owmIcon}@4x.png`;
    this.weatherSection.innerHTML = `
      <div class="container">
        <div class="weather-card fade-in">
          <div class="weather-card__content">
            <div class="weather-card__main">
              <div class="weather-card__icon-temp">
                <img src="${owmIconUrl}" width="64" height="64" class="weather-card__icon" alt="${data.weather[0].description}" />
                <div>
                  <p class="weather-card__temp">${Math.round(data.main.temp)}°C</p>
                  <p class="weather-card__desc">${data.weather[0].description}</p>
                </div>
              </div>
              <p class="weather-card__feels">Feels like ${Math.round(data.main.feels_like)}°C</p>
              <div class="weather-card__hl">
                <span>H: ${Math.round(data.main.temp_max)}°</span>
                <span>L: ${Math.round(data.main.temp_min)}°</span>
              </div>
            </div>
            <div class="weather-card__details">
              <div class="weather-detail">
                <img src="src/icons/wind.svg" width="24" height="24" class="lucide lucide-wind weather-detail__icon" alt="Wind" />
                <p class="weather-detail__label">Wind</p>
                <p class="weather-detail__value">${data.wind.speed} km/h</p>
              </div>
              <div class="weather-detail">
                <img src="src/icons/droplets.svg" width="24" height="24" class="lucide lucide-droplets weather-detail__icon" alt="Humidity" />
                <p class="weather-detail__label">Humidity</p>
                <p class="weather-detail__value">${data.main.humidity}%</p>
              </div>
              <div class="weather-detail">
                <img src="src/icons/eye.svg" width="24" height="24" class="lucide lucide-eye weather-detail__icon" alt="Visibility" />
                <p class="weather-detail__label">Visibility</p>
                <p class="weather-detail__value">${data.visibility / 1000} km</p>
              </div>
              <div class="weather-detail">
                <img src="src/icons/thermometer.svg" width="24" height="24" class="lucide lucide-thermometer weather-detail__icon" alt="Pressure" />
                <p class="weather-detail__label">Pressure</p>
                <p class="weather-detail__value">${data.main.pressure} hPa</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderPlaceholder() {
    this.weatherSection.innerHTML = `
      <div class="container">
        <div class="weather-card fade-in">
          <div class="weather-card__content">
            <div class="weather-card__main">
              <div class="weather-card__icon-temp">
                <img src="src/icons/cloud.svg" width="64" height="64" class="weather-card__icon" alt="Cloud" />
                <div>
                  <p class="weather-card__temp">&mdash;</p>
                  <p class="weather-card__desc">Enter a city</p>
                </div>
              </div>
              <p class="weather-card__feels">&nbsp;</p>
              <div class="weather-card__hl">
                <span>H: &mdash;</span>
                <span>L: &mdash;</span>
              </div>
            </div>
            <div class="weather-card__details">
              <div class="weather-detail">
                <img src="src/icons/wind.svg" width="24" height="24" class="lucide lucide-wind weather-detail__icon" alt="Wind" />
                <p class="weather-detail__label">Wind</p>
                <p class="weather-detail__value">&mdash;</p>
              </div>
              <div class="weather-detail">
                <img src="src/icons/droplets.svg" width="24" height="24" class="lucide lucide-droplets weather-detail__icon" alt="Humidity" />
                <p class="weather-detail__label">Humidity</p>
                <p class="weather-detail__value">&mdash;</p>
              </div>
              <div class="weather-detail">
                <img src="src/icons/eye.svg" width="24" height="24" class="lucide lucide-eye weather-detail__icon" alt="Visibility" />
                <p class="weather-detail__label">Visibility</p>
                <p class="weather-detail__value">&mdash;</p>
              </div>
              <div class="weather-detail">
                <img src="src/icons/thermometer.svg" width="24" height="24" class="lucide lucide-thermometer weather-detail__icon" alt="Pressure" />
                <p class="weather-detail__label">Pressure</p>
                <p class="weather-detail__value">&mdash;</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async animateCardTransition(renderFn) {
    const card = this.weatherSection.querySelector('.weather-card');
    if (card) {
      card.classList.remove('fade-in');
      card.classList.add('fade-out');
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    renderFn();
    const newCard = this.weatherSection.querySelector('.weather-card');
    if (newCard) {
      newCard.classList.remove('fade-out');
      newCard.classList.add('fade-in');
    }
  }

  updateLocation(data) {
    this.currentLocation.textContent = `${data.name}, ${data.sys.country}`;
  }

  handleError(err) {
    alert(err.message || 'City not found!');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new WeatherApp('3894f2877ca26ffd99eeab17f4762833');
});
