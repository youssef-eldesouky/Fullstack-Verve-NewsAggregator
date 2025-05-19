/**
 * Weather Widget - Displays current weather for a location
 */
class WeatherWidget {
  constructor(containerId = "weather-widget-container", city = "Cairo", country = "eg") {
    this.containerId = containerId
    this.city = city
    this.country = country
    this.container = document.getElementById(containerId)
    this.apiErrorCount = 0
    this.maxApiErrors = 3

    if (!this.container) {
      console.error(`Container with ID "${containerId}" not found`)
      return
    }

    this.init()
  }

  /**
   * Initialize the weather widget
   */
  init() {
    this.render()
    this.fetchWeather()

    // Refresh weather data every 30 minutes
    setInterval(() => this.fetchWeather(), 30 * 60 * 1000)
  }

  /**
   * Render the initial widget structure
   */
  render() {
    this.container.innerHTML = `
            <div class="weather-widget">
                <div class="weather-header">
                    <div class="weather-location">${this.city}, ${this.country.toUpperCase()}</div>
                    <button class="weather-refresh">Refresh</button>
                </div>
                <div class="weather-content">
                    <div class="weather-loading">Loading weather data...</div>
                </div>
            </div>
        `

    // Add event listener for refresh button
    this.container.querySelector(".weather-refresh").addEventListener("click", () => {
      this.fetchWeather()
    })
  }

  /**
   * Fetch weather data from the API
   */
  fetchWeather() {
    const content = this.container.querySelector(".weather-content")
    content.innerHTML = '<div class="weather-loading">Loading weather data...</div>'

    fetch(`/api/weather?city=${encodeURIComponent(this.city)}&country=${encodeURIComponent(this.country)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch weather: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        // Reset error count on successful fetch
        this.apiErrorCount = 0

        if (data.error) {
          throw new Error(data.message || "Error fetching weather data")
        }

        this.renderWeatherData(data)
      })
      .catch((error) => {
        console.error("Error fetching weather:", error)

        this.apiErrorCount++

        if (this.apiErrorCount >= this.maxApiErrors) {
          // After multiple failures, show a more permanent error message
          content.innerHTML = `
            <div class="weather-error">
                <p>Unable to load weather data. The weather service may be unavailable.</p>
            </div>
          `
        } else {
          // For initial failures, show a retry message
          content.innerHTML = `
            <div class="weather-error">
                Unable to load weather data.
                <button class="weather-retry">Retry</button>
            </div>
          `

          // Add retry button functionality
          const retryBtn = content.querySelector(".weather-retry")
          if (retryBtn) {
            retryBtn.addEventListener("click", () => this.fetchWeather())
          }
        }
      })
  }

  /**
   * Render weather data in the widget
   */
  renderWeatherData(data) {
    const content = this.container.querySelector(".weather-content")

    if (!data || data.error) {
      content.innerHTML = `
                <div class="weather-error">
                    ${data?.message || "Unable to load weather data"}
                </div>
            `
      return
    }

    // Use a default icon if none is provided
    const iconUrl = data.icon
      ? `https://openweathermap.org/img/wn/${data.icon}@2x.png`
      : "/placeholder.svg?height=50&width=50"

    // Format sunrise and sunset times if available
    const sunrise = data.sunrise
      ? new Date(data.sunrise).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "N/A"
    const sunset = data.sunset
      ? new Date(data.sunset).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "N/A"

    content.innerHTML = `
            <div class="weather-main">
                <img src="${iconUrl}" alt="${data.description || "Weather"}" class="weather-icon">
                <div>
                    <div class="weather-temp">${Math.round(data.temperature)}°C</div>
                    <div class="weather-desc">${data.description || "Current weather"}</div>
                </div>
            </div>
            <div class="weather-details">
                <div class="weather-detail">
                    <span class="weather-detail-label">Feels like:</span>
                    <span>${Math.round(data.feelsLike || data.temperature)}°C</span>
                </div>
                <div class="weather-detail">
                    <span class="weather-detail-label">Humidity:</span>
                    <span>${data.humidity || "N/A"}%</span>
                </div>
                <div class="weather-detail">
                    <span class="weather-detail-label">Wind:</span>
                    <span>${data.windSpeed || "N/A"} m/s</span>
                </div>
                <div class="weather-detail">
                    <span class="weather-detail-label">Pressure:</span>
                    <span>${data.pressure || "N/A"} hPa</span>
                </div>
                <div class="weather-detail">
                    <span class="weather-detail-label">Sunrise:</span>
                    <span>${sunrise}</span>
                </div>
                <div class="weather-detail">
                    <span class="weather-detail-label">Sunset:</span>
                    <span>${sunset}</span>
                </div>
            </div>
        `
  }

  /**
   * Update the city and country
   */
  updateLocation(city, country) {
    this.city = city
    this.country = country

    // Update the location display
    const locationElement = this.container.querySelector(".weather-location")
    if (locationElement) {
      locationElement.textContent = `${this.city}, ${this.country.toUpperCase()}`
    }

    // Fetch weather for the new location
    this.fetchWeather()
  }
}

// Initialize the weather widget when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Check if the container exists on each page
  const containers = document.querySelectorAll("#weather-widget-container")

  containers.forEach((container) => {
    // Create a new weather widget for each container
    new WeatherWidget(container.id, "Cairo", "eg")
  })
}) 