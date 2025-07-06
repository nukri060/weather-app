document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.forecast-control__btn');
  const forecastContent = document.querySelector('.forecast-content');
  
  const loadForecastContent = (period) => {
    forecastContent.innerHTML = `
    <h3>${period} Forecast</h3>
    <div class="todays-forecast">
    <p>Content for ${period.toLowerCase()} will appear here</p>
    </div>`;
  };

  const initialActive = document.querySelector('.forecast-control__btn.active');
  if (initialActive) {
    loadForecastContent(initialActive.textContent);
  }

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      buttons.forEach(btn => btn.classList.remove('active'));

      button.classList.add('active');
      
      loadForecastContent(button.textContent);
    });
  });
});