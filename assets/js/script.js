var formContainer = document.getElementById('form-container');
var fetchButton = document.getElementById('submit-button');
var cityTextInput = document.getElementById('city-name-text-input')
var APIKEY = '21ef4c0bff15173a6d1700345f872e1b'

var contentContainerEl = $('#column-container')
var currentWeatherEl = $('<div>')
currentWeatherEl.attr({class: 'col-10 col-lg-6 weather-display-container'})
var savedSearchContainer = $('#saved-search-container')

var currentWeatherInfo = $('<div>').attr({class: 'card p-3 my-3 weather-card d-flex flex-column'})
var forecastInfoContainer = $('<div>').attr({class: 'forecast-container d-flex justify-content-between'})

var latitude, longitude
currentWeatherEl.append(currentWeatherInfo)
currentWeatherEl.append(forecastInfoContainer)
contentContainerEl.append(currentWeatherEl)

function getLatLonCoordinates(city) {
  return fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=5&appid=${APIKEY}&}`)
    .then(response => response.json())
    .then(data => {
      [latitude, longitude] = [data[0].lat, data[0].lon]
      return [latitude, longitude, `${city}`]
    })
    .catch(err => console.error(err))
}

async function getWeather(city) {
  var currentDate = new Date().toLocaleDateString("en-US")
  var latitude, longitude, cityName
  [latitude, longitude, cityName] = await getLatLonCoordinates(city)
  // check if localStorage has weatherData object already; if not then create as object
  var weatherData = JSON.parse(localStorage.getItem("weatherData")) || {}
  // structures weatherData as needed if it is empty 
  if (Object.keys(weatherData).length === 0 || weatherData[cityName] === undefined) {
    weatherData[cityName] = {
      forecast: {},
      currentWeather: {}
    }
  } 

  // if weeatherData...header includes the currentDate, this implies that there is already information stored for the city being searched that happened today. As such, there's no need to fetch the currentWeather again for the same day and a return statement is used to exit the function prior to reaching the following fetch API requests.
  if (weatherData[cityName].currentWeather.header && weatherData[cityName].currentWeather.header.includes(currentDate)) {
    populateCurrentWeatherCardContent(cityName)
    populateForecastWeatherCardContent(cityName)
    return;
  }

  fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&units=imperial&appid=${APIKEY}`)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      // 1 -6 correspond to tomorrow, the day after tomorrow, etc.
      for (let i = 1; i < 6; i++) {
        let individualDayData = data.daily[i]
        weatherData[cityName]["forecast"][`${new Date(individualDayData.dt * 1000).toLocaleDateString("en-US")}`] = {
          icon: individualDayData.weather[0].icon,
          temp: `${individualDayData.temp.max} / ${individualDayData.temp.min}`,
          wind: individualDayData.wind_speed,
          humidity: individualDayData.humidity
        }
      }
      localStorage.setItem('weatherData', JSON.stringify(weatherData))
      populateForecastWeatherCardContent(cityName)
    });

  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=imperial&appid=${APIKEY}`)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      weatherData[cityName]["currentWeather"] = {
          header: `${data.name} (${currentDate})`,
          temp: data.main.temp,
          wind: data.wind.speed,
          humidity: data.main.humidity,
          icon: data.weather[0].icon
      }
      localStorage.setItem('weatherData', JSON.stringify(weatherData))
      populateCurrentWeatherCardContent(cityName)
    }); 
  // appends the newest search as a button
  var retrieveCityWeatherButton = $('<button>').attr({class: 'my-2', id: 'retrieve-weather-btn'}).text(cityName)
  savedSearchContainer.append(retrieveCityWeatherButton)
}

formContainer.addEventListener('click', function(e) {
  if (e.target.id === 'submit-button') {
    var cityName = (cityTextInput.value)
    if (cityName.length > 0) {
      getWeather(cityName)
    }
  }

  if (e.target.id === 'retrieve-weather-btn') {
    getWeather(e.target.innerHTML)
  }
});

function clearCurrentWeatherCardContent() {
  currentWeatherInfo.empty()
}

function clearForecastContainerContent() {
  forecastInfoContainer.empty()
}

async function populateCurrentWeatherCardContent(cityName) {
  clearCurrentWeatherCardContent()
  var weatherData = await JSON.parse(localStorage.getItem("weatherData"))
  var currentWeatherData = weatherData[cityName].currentWeather

  var currentWeatherCardHeaderContainer = $('<div>').attr({'class': 'd-flex align-items-center'})
  var currentWeatherCardHeaderIcon = $('<img>').attr({'src': `http://openweathermap.org/img/wn/${currentWeatherData.icon}.png`, 'height': '50px', 'width': '50px'})
  var currentWeatherCardHeaderText = $('<h3>').text(currentWeatherData.header)
  currentWeatherCardHeaderContainer.append(currentWeatherCardHeaderText)
  currentWeatherCardHeaderContainer.append(currentWeatherCardHeaderIcon)

  var currentWeatherCardTemp = $('<text>').text(`Temp: ${currentWeatherData.temp} ℉`)
  var currentWeatherCardWind = $('<text>').text(`Wind: ${currentWeatherData.wind} MPH`)
  var currentWeatherCardHumidity = $('<text>').text(`Humidity: ${currentWeatherData.humidity} %`)
  currentWeatherInfo.append(currentWeatherCardHeaderContainer)
  currentWeatherInfo.append(currentWeatherCardTemp)
  currentWeatherInfo.append(currentWeatherCardWind)
  currentWeatherInfo.append(currentWeatherCardHumidity)
}

async function populateForecastWeatherCardContent(cityName) {
  clearForecastContainerContent()
  var weatherData = await JSON.parse(localStorage.getItem("weatherData"))
  var forecastData = weatherData[cityName].forecast
  var forecastCard = $('<div>').attr({class: 'card p-3 my-3 forecast-card'})

  Object.keys(forecastData).forEach(key => {
    var clone = forecastCard.clone()
    var forecastCardHeader = $('<h5>').text(key)
    var forecastCardIcon = $('<img>').attr({'src': `http://openweathermap.org/img/wn/${forecastData[key].icon}.png`, 'height': '50px', 'width': '50px'})
    var forecastCardTemp = $('<text>').text(`Hi/Low Temp: ${forecastData[key].temp} ℉`)
    var forecastCardWind = $('<text>').text(`Wind: ${forecastData[key].wind} MPH`)
    var forecastCardHumidity = $('<text>').text(`Humidity: ${forecastData[key].humidity} %`)
    clone.append(forecastCardHeader)
    clone.append(forecastCardIcon)
    clone.append(forecastCardTemp)
    clone.append(forecastCardWind)
    clone.append(forecastCardHumidity)

    forecastInfoContainer.append(clone)
  })
}

// built as IIFE to load in any saved information at first load
(async function appendCitySearchButton() {
  var weatherData = await JSON.parse(localStorage.getItem("weatherData"))

  if (weatherData) {
    var retrieveCityWeatherButton = $('<button>').attr({class: 'my-2', id: 'retrieve-weather-btn'})
  
    Object.keys(weatherData).forEach(city => {
      var clone = retrieveCityWeatherButton.clone().text(city)
      clone.text(city)
      savedSearchContainer.append(clone)
    })
  }
})()

