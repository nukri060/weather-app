class WeatherApp {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.cachedData = {};
    this.currentCoords = null;
    this.elements = {
      searchForm: document.querySelector('.search-form'),
      searchInput: document.querySelector('#city-search'),
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
    this.initialLoad();
  }

  async initialLoad() {
    const defaultCity = "Batumi"; 
    if (defaultCity) {
      this.elements.searchInput.value = defaultCity;
      await this.handleSearch(new Event('submit', { cancelable: true })); 
    }
  }

  async handleSearch(e) {
    e.preventDefault();
    const city = this.elements.searchInput.value.trim();

    if (!city) return;

    try {
      this.cachedData = {};
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
      
      this.elements.buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      });
      const todayButton = Array.from(this.elements.buttons).find(btn => btn.textContent.trim() === 'Today');
      if (todayButton) {
        todayButton.classList.add('active');
        todayButton.setAttribute('aria-pressed', 'true');
      }
      
      this.loadCategoryData('Today', oneCallData); 
    } catch (err) {
      console.error("Error in handleSearch:", err);
      alert(err.message || 'City not found!');
      await this.animateTransition(() => this.renderPlaceholder());
      this.elements.currentLocation.textContent = '';
      this.elements.lastUpdated.textContent = ''; 
      this.elements.forecastContent.innerHTML = ''; 
    }
  }

  async handleRefresh() {
    if (!this.elements.searchInput.value.trim()) {
      alert("Please search for a city first.");
      return;
    }
    const currentCity = this.elements.searchInput.value.trim();
    if (currentCity) {
      this.cachedData = {}; 
      await this.handleSearch(new Event('submit', { cancelable: true }));
    }
  }

  updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.elements.lastUpdated.textContent = timeString;
    this.elements.lastUpdated.setAttribute('datetime', now.toISOString());
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
    if (this.cachedData.oneCallData && this.cachedData.oneCallData.hourly) {
      return this.cachedData.oneCallData.hourly;
    }
    
    const res = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,daily,alerts&appid=${this.apiKey}&units=metric`
    );
    if (!res.ok) throw new Error('Failed to fetch hourly forecast');
    const data = await res.json();
    this.cachedData.hourly = data.hourly;
    return this.cachedData.hourly;
  }

  async fetchWeeklyForecast(lat, lon) {
    if (this.cachedData.oneCallData && this.cachedData.oneCallData.daily) {
      return this.cachedData.oneCallData.daily;
    }

  
    const res = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,alerts&appid=${this.apiKey}&units=metric`
    );
    if (!res.ok) throw new Error('Failed to fetch weekly forecast');
    const data = await res.json();
    this.cachedData.weekly = data.daily; 
    return this.cachedData.weekly;
  }
} 