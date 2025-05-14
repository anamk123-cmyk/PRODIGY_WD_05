const API_KEY = "d3f59ab351807ae8fccc886a396758fb";
const loader = document.getElementById("loader");
const weatherInfo = document.getElementById("weatherInfo");
const forecastDiv = document.getElementById("forecast");
const historyList = document.getElementById("historyList");

function showLoader() {
  loader.style.display = "block";
  weatherInfo.style.display = "none";
  forecastDiv.style.display = "none";
}

function hideLoader() {
  loader.style.display = "none";
}

function displayWeather(data) {
  const { name } = data;
  const { icon, description } = data.weather[0];
  const { temp, humidity } = data.main;
  const { speed } = data.wind;

  weatherInfo.innerHTML = `
    <h2>${name}</h2>
    <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}" />
    <p><strong>${description}</strong></p>
    <p>🌡️ Temp: ${temp} °C</p>
    <p>💧 Humidity: ${humidity}%</p>
    <p>🌬️ Wind Speed: ${speed} m/s</p>
  `;
  weatherInfo.style.display = "block";
}

function displayForecast(forecastData) {
  const list = forecastData.list.filter(item => item.dt_txt.includes("12:00:00"));
  forecastDiv.innerHTML = `<h3>5-Day Forecast</h3>` + list.map(day => {
    const date = new Date(day.dt_txt).toLocaleDateString();
    const icon = day.weather[0].icon;
    const desc = day.weather[0].description;
    const temp = day.main.temp;
    return `
      <div class="forecast-day">
        <span>${date}</span>
        <span><img src="https://openweathermap.org/img/wn/${icon}.png" alt="" /></span>
        <span>${desc} - ${temp}°C</span>
      </div>`;
  }).join('');
  forecastDiv.style.display = "block";
}

function addToHistory(city) {
  const cities = JSON.parse(localStorage.getItem("history")) || [];
  if (!cities.includes(city)) {
    cities.unshift(city);
    if (cities.length > 5) cities.pop();
    localStorage.setItem("history", JSON.stringify(cities));
    renderHistory();
  }
}

function renderHistory() {
  const cities = JSON.parse(localStorage.getItem("history")) || [];
  historyList.innerHTML = cities.map(city => `<li onclick="getWeatherByCity('${city}')">${city}</li>`).join('');
}

function getWeatherByCity(cityName) {
  const city = cityName || document.getElementById("cityInput").value;
  if (!city) return alert("Enter a city name");

  showLoader();
  const weatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
  const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;

  Promise.all([fetch(weatherURL), fetch(forecastURL)])
    .then(async ([res1, res2]) => {
      const data1 = await res1.json();
      const data2 = await res2.json();
      hideLoader();
      if (data1.cod !== 200) return alert(data1.message);
      displayWeather(data1);
      displayForecast(data2);
      addToHistory(city);
    })
    .catch(() => {
      hideLoader();
      alert("Failed to fetch weather data.");
    });
}

function getWeatherByLocation() {
  if (navigator.geolocation) {
    showLoader();
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      const weatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;
      const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;

      Promise.all([fetch(weatherURL), fetch(forecastURL)])
        .then(async ([res1, res2]) => {
          const data1 = await res1.json();
          const data2 = await res2.json();
          hideLoader();
          displayWeather(data1);
          displayForecast(data2);
          addToHistory(data1.name);
        })
        .catch(() => {
          hideLoader();
          alert("Location fetch failed.");
        });
    }, () => {
      hideLoader();
      alert("Location permission denied.");
    });
  } else {
    alert("Geolocation not supported.");
  }
}

renderHistory();
