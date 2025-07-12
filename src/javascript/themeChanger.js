function setupThemeButtons() {
  const themeButtons = document.querySelectorAll(".theme-btn");

  themeButtons.forEach(button => {
    button.addEventListener('click', () => {
      themeButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      });
      
      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');
      
      const selectedTheme = button.dataset.theme || button.textContent.trim().toLowerCase();
      
      applyTheme(selectedTheme);
    });
  });
}

function applyTheme(themeName) {
  document.body.classList.remove(
    'blue-gradient-theme',
    'pink-gradient-theme',
    'dark-gradient-theme'
  );
  
  let themeClass;
  switch(themeName) {
    case 'day':
    case 'light':
      themeClass = 'blue-gradient-theme';
      break;
    case 'night':
    case 'dark':
      themeClass = 'dark-gradient-theme';
      break;
    case 'gradient':
    case 'pink':
      themeClass = 'pink-gradient-theme';
      break;
    default:
      themeClass = 'blue-gradient-theme'; 
  }
  
  document.body.classList.add(themeClass);
  
  localStorage.setItem('selectedTheme', themeName);
}

document.addEventListener('DOMContentLoaded', () => {
  setupThemeButtons();
  
  const savedTheme = localStorage.getItem('selectedTheme') || 'day';
  const initialButton = document.querySelector(`.theme-btn[data-theme="${savedTheme}"]`);
  if (initialButton) {
    initialButton.click();
  } else {
    applyTheme(savedTheme);
  }
});