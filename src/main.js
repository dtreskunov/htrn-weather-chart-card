import locale from './locale.js';
import {
  cardinalDirectionsIcon,
  weatherIcons,
  weatherIconsDay,
  weatherIconsNight,
  WeatherEntityFeature
} from './const.js';
import { LitElement, html } from 'lit';
import './htrn-weather-chart-card-editor.js';
import { property } from 'lit/decorators.js';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
Chart.register(...registerables, ChartDataLabels);

const DEFAULT_CONFIG = {
  animated_icons: false,
  autoscroll: false,
  current_temp_size: 28,
  day_date_size: 15,
  icon_style: 'style1',
  icons_size: 25,
  show_attributes: true,
  show_current_condition: true,
  show_date: false,
  show_day: false,
  show_description: false,
  show_dew_point: false,
  show_apparent_temperature: false,
  show_humidity: true,
  show_last_changed: false,
  show_main: true,
  show_pressure: true,
  show_sun: true,
  show_temperature: true,
  show_time_seconds: false,
  show_time: false,
  show_uv_index: true,
  show_visibility: false,
  show_wind_bearing: true,
  show_wind_gust_speed: false,
  show_wind_speed: true,
  time_size: 26,
  use_12hour_format: false,
  forecast: {
    chart_height: 180,
    condition_icons: true,
    disable_animation: false,
    labels_font_size: 11,
    number_of_forecasts: 0,
    precip_bar_size: 100,
    precipitation_color: 'rgba(132, 209, 253, 1.0)',
    precipitation_type: 'rainfall',
    round_temp: false,
    show_probability: false,
    show_wind_forecast: true,
    style: 'style1',
    temperature1_color: 'rgba(255, 152, 0, 1.0)',
    temperature2_color: 'rgba(68, 115, 158, 1.0)',
    type: 'daily',
  },
  units: {
    distance: 'km',
    pressure: 'hPa',
    speed: 'km/h',
  },
  sources: {
    temperature: 'temperature',
    temperature_unit: 'temperature_unit',
    humidity: 'humidity',
    pressure: 'pressure',
    pressure_unit: 'pressure_unit',
    uv_index: 'uv_index',
    wind_speed: 'wind_speed',
    wind_speed_unit: 'wind_speed_unit',
    dew_point: 'dew_point',
    dew_point_unit: 'temperature_unit',
    wind_bearing: 'wind_bearing',
    wind_gust_speed: 'wind_gust_speed',
    wind_gust_speed_unit: 'wind_speed_unit',
    visibility: 'visibility',
    visibility_unit: 'visibility_unit',
    apparent_temperature: 'apparent_temperature',
    apparent_temperature_unit: 'temperature_unit',
  },
}

class HTRNWeatherChartCard extends LitElement {

  static getConfigElement() {
    return document.createElement("htrn-weather-chart-card-editor");
  }

  static getStubConfig(hass, unusedEntities, allEntities) {
    let entity = unusedEntities.find((eid) => eid.split(".")[0] === "weather");
    if (!entity) {
      entity = allEntities.find((eid) => eid.split(".")[0] === "weather");
    }
    return {
      ...DEFAULT_CONFIG,
      entity,
    };
  }

  static get properties() {
    return {
      _hass: {},
      config: {},
      language: {},
      sun: { type: Object },
      weather: { type: Object },
      option1: { type: Object },
      option2: { type: Object },
      option3: { type: Object },
      forecastChart: { type: Object },
      forecastItems: { type: Number },
      forecast: { type: Array }
    };
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Please, define entity in the card config');
    }

    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      forecast: {
        ...DEFAULT_CONFIG.forecast,
        ...config.forecast,
      },
      units: {
        ...DEFAULT_CONFIG.units,
        ...config.units,
      },
      sources: {
        ...DEFAULT_CONFIG.sources,
        ...config.sources,
      }
    };
  }

  /**
   * foo -> ${this.config.entity}.attributes.foo
   * sensor.foo -> sensor.foo.state
   * weather.alt_home.foo -> weather.alt_home.attributes.foo
   */
  getCurrentWeatherAttribute(name) {
    const source = this.config.sources[name];
    if (!source) {
      console.debug(`No source defined for weather attribute ${name}`);
      return undefined;
    }
    const splitSource = source.split('.', 3);
    if (splitSource.length === 1) {
      let entityId = this.config.entity;
      let attr = source;
    } else if (splitSource.length === 2) {
      let entityId = source;
      let attr = undefined;
    } else if (splitSource.length === 3) {
      let entityId = splitSource.slice(0,2).join('.');
      let attr = splitSource[2];
    }
    const entity = this._hass.states[entityId];

    if (!entity) {
      console.debug(`Entity ${entityId} not found for weather attribute ${name}, mapped to ${source}`);
      return undefined;
    }
    
    const val = attr ? entity.attributes[attr] : entity.state;
    return parseFloat(val) || val;
  }

  set hass(hass) {
    this.weather = this.config.entity in hass.states ? hass.states[this.config.entity] : null;
    if (!this.weather) { // || this.weather.state == "unavailable") {
      console.error(`weather entity ${this.config.entity} is absent`);
      return;
    }

    this._hass = hass;
    this.language = this.config.locale || hass.selectedLanguage || hass.language;
    this.sun = 'sun.sun' in hass.states ? hass.states['sun.sun'] : null;
    this.unitPressure = this.config.units.pressure ? this.config.units.pressure : this.weather && this.weather.attributes.pressure_unit;
    this.unitVisibility = this.config.units.visibility ? this.config.units.visibility : this.weather && this.weather.attributes.visibility_unit;

    // this.temperature = this.getCurrentWeatherAttribute('temperature');
    // this.humidity = this.getCurrentWeatherAttribute('humidity');
    // this.pressure = this.getCurrentWeatherAttribute('pressure');
    // this.uv_index = this.getCurrentWeatherAttribute('uv_index');
    // this.windSpeed = this.getCurrentWeatherAttribute('wind_speed');
    // this.dew_point = this.getCurrentWeatherAttribute('dew_point');
    // this.wind_gust_speed = this.getCurrentWeatherAttribute('wind_gust_speed');
    // this.visibility = this.getCurrentWeatherAttribute('visibility');
    // this.windDirection = this.getCurrentWeatherAttribute('wind_bearing');
    // this.feels_like = this.getCurrentWeatherAttribute('apparent_temperature');
    // this.description = this.config.description && hass.states[this.config.description] ? hass.states[this.config.description].state : this.weather.attributes.description;

    this.option1 = this.config.option1 in hass.states ? hass.states[this.config.option1] : null;
    this.option2 = this.config.option2 in hass.states ? hass.states[this.config.option2] : null;
    this.option3 = this.config.option3 in hass.states ? hass.states[this.config.option3] : null;

    this.baseIconPath = hass.hassUrl(`/hacsfiles/htrn-weather-chart-card/${this.config.icon_style === 'style2' ? 'icons2' : 'icons'}/`);
    this.subscribeForecastEvents();
  }

  unsubscribeForecastEvents() {
    if (!this.subscription) {
      return;
    }
    this.subscription.then(unsubscribe => unsubscribe());
    this.subscription = undefined;
  }

  subscribeForecastEvents() {
    //const feature = isHourly ? WeatherEntityFeature.FORECAST_HOURLY : WeatherEntityFeature.FORECAST_DAILY;
    //if (!this.supportsFeature(feature)) {
    //  console.error(`Weather entity "${this.config.entity}" does not support ${isHourly ? 'hourly' : 'daily'} forecasts.`);
    //  return;
    //}

    if (this.subscription) {
      console.debug('Already subscribed for messages with type: weather/subscribe_forecast');
      return;
    }

    const callback = ({ forecast }) => {
      this.forecast = forecast;
      this.requestUpdate();
      this.drawChart();
    };

    // returns promise that resolves to an unsubscribe function
    // See https://github.com/home-assistant/home-assistant-js-websocket
    this.subscription = this._hass.connection.subscribeMessage(callback, {
      type: "weather/subscribe_forecast",
      forecast_type: this.config.forecast.type,
      entity_id: this.config.entity,
    });
  }

  supportsFeature(feature) {
    return (this.weather.attributes.supported_features & feature) !== 0;
  }

  constructor() {
    super();
    this.resizeObserver = null;
    this.resizeInitialized = false;
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.resizeInitialized) {
      this.delayedAttachResizeObserver();
    }
  }

  delayedAttachResizeObserver() {
    setTimeout(() => {
      this.attachResizeObserver();
      this.resizeInitialized = true;
    }, 0);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.detachResizeObserver();
    this.unsubscribeForecastEvents();
  }

  attachResizeObserver() {
    this.resizeObserver = new ResizeObserver(() => {
      this.measureCard();
    });
    const card = this.shadowRoot.querySelector('ha-card');
    if (card) {
      this.resizeObserver.observe(card);
    }
  }

  detachResizeObserver() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
      this.resizeInitialized = false;
    }
  }

  measureCard() {
    const hacard = this.shadowRoot.querySelector('ha-card');
    const card = hacard.querySelector('.forecast-container');
    let fontSize = this.config.forecast.labels_font_size;
    const numberOfForecasts = this.config.forecast.number_of_forecasts || 0;

    if (!card) {
      return;
    }

    if (numberOfForecasts > 0) {
      this.forecastItems = numberOfForecasts;
      if (this.forecast) {
        let newWidth = (fontSize + 20) * Math.min(this.forecast.length, this.forecastItems);
        if (newWidth < card.offsetWidth) {
          newWidth = card.offsetWidth
        } else {
          const forecastContainer = this.shadowRoot.querySelector('.forecast-container');
          const chartContainer = this.shadowRoot.querySelector('.chart-container');
          const conditionsContainer = this.shadowRoot.querySelector('.conditions');
          const windContainer = this.shadowRoot.querySelector('.wind-details');

          if (forecastContainer) {
            forecastContainer.style.width = `${newWidth}px`;
            forecastContainer.style.overflowX = 'scroll';
          }

          if (chartContainer) {
            chartContainer.style.width = `${newWidth + (fontSize * 2.5) + 5}px`;
          }

          if (conditionsContainer) {
            conditionsContainer.style.width = `${newWidth + (fontSize * 2)}px`;
          }

          if (windContainer) {
            windContainer.style.width = `${newWidth + (fontSize * 2)}px`;
          }
        }
      }
    } else {
      this.forecastItems = Math.round((card.offsetWidth) / (fontSize + 20) - 1);
    }
    this.drawChart();
  }

  ll(str) {
    const selectedLocale = this.config.locale || this.language || 'en';

    if (locale[selectedLocale] === undefined) {
      return locale.en[str];
    }

    return locale[selectedLocale][str];
  }

  getCardSize() {
    return 4;
  }

  /**
   * length: "mi", accumulated_precipitation: "in", area: "ft²", mass: "lb", pressure: "psi", temperature: "°F", volume: "gal", wind_speed: "mph"
   */
  getUnit(unit) {
    return this._hass.config.unit_system[unit] || '';
  }

  getWeatherIcon(condition, sun) {
    if (this.config.animated_icons === true) {
      const iconName = sun === 'below_horizon' ? weatherIconsNight[condition] : weatherIconsDay[condition];
      return `${this.baseIconPath}${iconName}.svg`;
    } else if (this.config.icons) {
      const iconName = sun === 'below_horizon' ? weatherIconsNight[condition] : weatherIconsDay[condition];
      return `${this.config.icons}${iconName}.svg`;
    }
    return weatherIcons[condition];
  }

  getWindDirIcon(deg) {
    if (typeof deg === 'number') {
      return cardinalDirectionsIcon[parseInt((deg + 22.5) / 45.0)];
    } else {
      var i = 9;
      switch (deg) {
        case "N":
          i = 0;
          break;
        case "NNE":
        case "NE":
          i = 1;
          break;
        case "ENE":
        case "E":
          i = 2;
          break;
        case "ESE":
        case "SE":
          i = 3;
          break;
        case "SSE":
        case "S":
          i = 4;
          break;
        case "SSW":
        case "SW":
          i = 5;
          break;
        case "WSW":
        case "W":
          i = 6;
          break;
        case "NW":
        case "NNW":
          i = 7;
          break;
        case "WNW":
          i = 8;
          break;
        default:
          i = 9;
          break;
      }
      return cardinalDirectionsIcon[i];
    }
  }

  getWindDir(deg) {
    if (typeof deg === 'number') {
      return this.ll('cardinalDirections')[parseInt((deg + 11.25) / 22.5)];
    } else {
      return deg;
    }
  }

  calculateBeaufortScale(windSpeed, wind_speed_unit) {
    const unitConversion = {
      'km/h': 1,
      'm/s': 3.6,
      'mph': 1.60934,
    };

    const conversionFactor = unitConversion[wind_speed_unit];

    if (typeof conversionFactor !== 'number') {
      throw new Error(`Unknown wind_speed_unit: ${wind_speed_unit}`);
    }

    const windSpeedInKmPerHour = windSpeed * conversionFactor;

    if (windSpeedInKmPerHour < 1) return 0;
    else if (windSpeedInKmPerHour < 6) return 1;
    else if (windSpeedInKmPerHour < 12) return 2;
    else if (windSpeedInKmPerHour < 20) return 3;
    else if (windSpeedInKmPerHour < 29) return 4;
    else if (windSpeedInKmPerHour < 39) return 5;
    else if (windSpeedInKmPerHour < 50) return 6;
    else if (windSpeedInKmPerHour < 62) return 7;
    else if (windSpeedInKmPerHour < 75) return 8;
    else if (windSpeedInKmPerHour < 89) return 9;
    else if (windSpeedInKmPerHour < 103) return 10;
    else if (windSpeedInKmPerHour < 118) return 11;
    else return 12;
  }

  async firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    this.measureCard();
    await new Promise(resolve => setTimeout(resolve, 0));
    this.drawChart();

    if (this.config.autoscroll) {
      this.autoscroll();
    }
  }


  async updated(changedProperties) {
    await this.updateComplete;

    if (changedProperties.has('config')) {
      const oldConfig = changedProperties.get('config');

      const entityChanged = oldConfig && this.config.entity !== oldConfig.entity;
      const forecastTypeChanged = oldConfig && this.config.forecast.type !== oldConfig.forecast.type;
      const autoscrollChanged = oldConfig && this.config.autoscroll !== oldConfig.autoscroll;

      if (entityChanged || forecastTypeChanged) {
        this.unsubscribeForecastEvents();
        this.subscribeForecastEvents();
      }

      if (this.forecast && this.forecast.length) {
        this.drawChart();
      }

      if (autoscrollChanged) {
        if (!this.config.autoscroll) {
          this.autoscroll();
        } else {
          this.cancelAutoscroll();
        }
      }
    }

    if (changedProperties.has('weather')) {
      this.updateChart();
    }
  }

  autoscroll() {
    if (this.autoscrollTimeout) {
      // Autscroll already set, nothing to do
      return;
    }

    const updateChartOncePerHour = () => {
      const now = new Date();
      const nextHour = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours() + 1,
      );
      const timeout = nextHour - now;
      this.autoscrollTimeout = setTimeout(() => {
        this.autoscrollTimeout = null;
        this.updateChart();
        updateChartOncePerHour();
      }, timeout);
    };

    updateChartOncePerHour();
  }

  cancelAutoscroll() {
    if (this.autoscrollTimeout) {
      clearTimeout(this.autoscrollTimeout);
    }
  }

  drawChart({ config, language } = this) {
    if (!this.forecast || !this.forecast.length) {
      console.debug('drawChart: no forecast');
      return;
    }

    const forecastCanvas = this.renderRoot && this.renderRoot.querySelector('canvas#forecastCanvas');
    if (!forecastCanvas) {
      console.debug('drawChart: canvas element not found');
      return;
    }

    var style = getComputedStyle(document.body);
    var backgroundColor = style.getPropertyValue('--card-background-color');
    var textColor = style.getPropertyValue('--primary-text-color');
    var dividerColor = style.getPropertyValue('--divider-color');

    const tempUnit = this.getCurrentWeatherAttribute('temperature_unit');
    let precipMax;
    let precipUnit;

    if (config.forecast.precipitation_type === 'probability') {
      precipMax = 100;
      precipUnit = '%';
    } else {
      if (this.getUnit('length') === 'km') {
        precipMax = config.forecast.type === 'hourly' ? 4 : 20;
        precipUnit = 'mm';
      } else {
        precipMax = config.forecast.type === 'hourly' ? 1 : 5;
        precipUnit = 'in';
      }
    }

    Chart.defaults.color = textColor;
    Chart.defaults.scale.grid.color = dividerColor;
    Chart.defaults.elements.line.fill = false;
    Chart.defaults.elements.line.tension = 0.3;
    Chart.defaults.elements.line.borderWidth = 1.5;
    Chart.defaults.elements.point.radius = 2;
    Chart.defaults.elements.point.hitRadius = 10;

    const {
      dateTime,
      tempHigh,
      tempLow,
      precip,
    } = this.computeForecastData();

    const chart_text_color = (config.forecast.chart_text_color === 'auto') ? textColor : config.forecast.chart_text_color;

    const defaultDatalabels = {
      backgroundColor: backgroundColor,
      borderColor: context => context.dataset.backgroundColor,
      borderRadius: 5,
      borderWidth: 1,
      padding: config.forecast.precipitation_type === 'rainfall' && config.forecast.show_probability && config.forecast.type !== 'hourly' ? 3 : 4,
      color: chart_text_color || textColor,
      font: {
        size: config.forecast.labels_font_size,
        lineHeight: 0.7,
      },
      formatter: (value, context) => context.dataset.data[context.dataIndex] + '°',
    };

    const tempHiDataset = {
      label: this.ll('tempHi'),
      type: 'line',
      data: tempHigh,
      spanGaps: true,
      yAxisID: 'TempAxis',
      borderColor: config.forecast.temperature1_color,
      backgroundColor: config.forecast.temperature1_color,
      datalabels: config.forecast.style !== 'style2' ? defaultDatalabels : {
        ...defaultDatalabels,
        align: 'top',
        anchor: 'center',
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        color: chart_text_color || config.forecast.temperature1_color,
      },
    };

    const tempLoDataset = {
      label: this.ll('tempLo'),
      type: 'line',
      data: tempLow,
      spanGaps: true,
      yAxisID: 'TempAxis',
      borderColor: config.forecast.temperature2_color,
      backgroundColor: config.forecast.temperature2_color,
      datalabels: config.forecast.style !== 'style2' ? defaultDatalabels : {
        ...defaultDatalabels,
        align: 'bottom',
        anchor: 'center',
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        color: chart_text_color || config.forecast.temperature2_color,
      },
    };

    const precipDataset = {
      label: this.ll('precip'),
      type: 'bar',
      data: precip,
      yAxisID: 'PrecipAxis',
      borderColor: config.forecast.precipitation_color,
      backgroundColor: config.forecast.precipitation_color,
      barPercentage: config.forecast.precip_bar_size / 100,
      categoryPercentage: 1.0,
      datalabels: {
        ...defaultDatalabels,
        textAlign: 'center',
        textBaseline: 'middle',
        align: 'top',
        anchor: 'start',
        offset: -10,

        display: context => context.dataset.data[context.dataIndex] > 0,
        formatter: (value, context) => {
          const rainfall = context.dataset.data[context.dataIndex];
          let formattedValue = `${rainfall.toFixed(rainfall > 1 ? 0 : 1)} ${this.ll('units')[precipUnit]}`;

          if (config.forecast.show_probability && config.forecast.precipitation_type !== 'probability') {
            const probability = this.forecast[context.dataIndex].precipitation_probability;
            if (probability !== undefined && probability !== null) {
              formattedValue += `\n\n${probability.toFixed(0)}%`;
            }
          }
          return formattedValue;
        },
      },

      tooltip: {
        callbacks: {
          label: context => {
            let formattedLabel = `${context.dataset.label}: ${context.formattedValue}${precipUnit}`;
            if (!config.forecast.show_probability && config.forecast.precipitation_type !== 'probability') {
              const probability = this.forecast[context.dataIndex].precipitation_probability;
              if (probability !== undefined && probability !== null) {
                formattedLabel += ` / ${probability.toFixed(0)}%`;
              }
            }
            return formattedLabel;
          },
        },
      },
    };

    if (this.forecastChart) {
      this.forecastChart.destroy();
    }
    this.forecastChart = new Chart(forecastCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: dateTime,
        datasets: [tempHiDataset, tempLoDataset, precipDataset],
      },
      options: {
        maintainAspectRatio: false,
        animation: config.forecast.disable_animation === true ? { duration: 0 } : {},
        layout: {
          padding: {
            bottom: 10
          },
        },
        scales: {
          x: {
            position: 'top',
            border: {
              width: 0,
            },
            grid: {
              drawTicks: false,
              color: dividerColor,
            },
            ticks: {
              maxRotation: 0,
              color: config.forecast.chart_datetime_color || textColor,
              padding: config.forecast.precipitation_type === 'rainfall' && config.forecast.show_probability && config.forecast.type !== 'hourly' ? 4 : 10,
              callback: function (value, index, values) {
                const dateObj = new Date(this.getLabelForValue(value));
                const time = dateObj.toLocaleTimeString(language, {
                  hour12: config.use_12hour_format,
                  hour: 'numeric'
                }).replace('a.m.', 'AM').replace('p.m.', 'PM');
                const weekday = dateObj.toLocaleString(language, { weekday: 'short' }).toUpperCase();

                if (config.forecast.type === 'hourly') {
                  if (dateObj.getHours() === 0 && dateObj.getMinutes() === 0) {
                    return [weekday, time];
                  } else {
                    return time;
                  }
                } else {
                  return weekday;
                }
              },
            },
            reverse: document.dir === 'rtl' ? true : false,
          },
          TempAxis: {
            position: 'left',
            beginAtZero: false,
            suggestedMin: Math.min(...tempHigh.filter(v => v != null), ...tempLow.filter(v => v != null)) - 5,
            suggestedMax: Math.max(...tempHigh.filter(v => v != null), ...tempLow.filter(v => v != null)) + 3,
            grid: {
              display: false,
              drawTicks: false,
            },
            ticks: {
              display: false,
            },
          },
          PrecipAxis: {
            position: 'right',
            suggestedMax: precipMax,
            grid: {
              display: false,
              drawTicks: false,
            },
            ticks: {
              display: false,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            caretSize: 0,
            caretPadding: 15,
            callbacks: {
              title: tooltipItem => {
                const datetime = tooltipItem[0].label;
                return new Date(datetime).toLocaleDateString(language, {
                  month: 'short',
                  day: 'numeric',
                  weekday: 'short',
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: config.use_12hour_format,
                });
              },
              label: context => `${context.dataset.label}: ${context.formattedValue}${tempUnit}`,
            },
          },
        },
      },
    });
  }

  computeForecastData({ config, forecastItems } = this) {
    const forecast = this.forecast ? this.forecast.slice(0, forecastItems) : [];
    const dateTime = [];
    const tempHigh = [];
    const tempLow = [];
    const precip = [];

    for (const forecastPoint of forecast) {
      if (config.autoscroll) {
        const cutoff = (config.forecast.type === 'hourly' ? 1 : 24) * 60 * 60 * 1000;
        if (new Date() - new Date(forecastPoint.datetime) > cutoff) {
          continue;
        }
      }
      dateTime.push(forecastPoint.datetime);

      let tempHighVal = null;
      let tempLowVal = null;
      if (config.forecast.type === 'twice_daily') {
        if (forecastPoint.is_daytime || this.mode == 'hourly') {
          tempHighVal = forecastPoint.temperature;
        } else {
          tempLowVal = forecastPoint.temperature;
        }
      } else {
        tempHighVal = forecastPoint.temperature;
        if (typeof forecastPoint.templow !== 'undefined') {
          tempLowVal = forecastPoint.templow;
        }

        if (config.forecast.round_temp == true) {
          tempHighVal = Math.round(tempHighVal);
          if (typeof tempLowVal === 'number') {
            tempLowVal = Math.round(tempLowVal);
          }
        }
      }
      tempHigh.push(tempHighVal);
      tempLow.push(tempLowVal);

      if (config.forecast.precipitation_type === 'probability') {
        if (typeof forecastPoint.precipitation_probability == 'number') {
          precip.push(forecastPoint.precipitation_probability);
        } else {
          precip.push(0);
        }
      } else {
        if (typeof forecastPoint.precipitation == 'number') {
          precip.push(forecastPoint.precipitation);
        } else {
          precip.push(0);
        }
      }
    }

    return {
      dateTime,
      tempHigh,
      tempLow,
      precip,
    }
  }

  updateChart({ forecast, forecastChart } = this) {
    if (!forecast || !forecast.length) {
      return [];
    }

    if (forecastChart) {
      const {
        dateTime,
        tempHigh,
        tempLow,
        precip,
      } = this.computeForecastData();

      forecastChart.data.labels = dateTime;
      forecastChart.data.datasets[0].data = tempHigh;
      forecastChart.data.datasets[1].data = tempLow;
      forecastChart.data.datasets[2].data = precip;
      forecastChart.update();
    }
  }

  render({ config, _hass, weather } = this) {
    if (!config || !_hass) {
      return html``;
    }
    if (!weather || !weather.attributes) {
      return html`
        <style>
          .card {
            padding-top: ${config.title ? '0px' : '16px'};
            padding-right: 16px;
            padding-bottom: 16px;
            padding-left: 16px;
          }
        </style>
        <ha-card header="${config.title}">
          <div class="card">
            Please, check your weather entity
          </div>
        </ha-card>
      `;
    }
    return html`
      <style>
        ha-icon {
          color: var(--paper-item-icon-color);
        }
        img {
          width: ${config.icons_size}px;
          height: ${config.icons_size}px;
        }
        .card {
          padding-top: ${config.title ? '0px' : '16px'};
          padding-right: 16px;
          padding-bottom: ${config.show_last_changed === true ? '2px' : '16px'};
          padding-left: 16px;
        }
        .main {
          display: flex;
          align-items: center;
          font-size: ${config.current_temp_size}px;
          margin-bottom: 10px;
        }
        .main ha-icon {
          --mdc-icon-size: 50px;
          margin-right: 14px;
          margin-inline-start: initial;
          margin-inline-end: 14px;
        }
        .main img {
          width: ${config.icons_size * 2}px;
          height: ${config.icons_size * 2}px;
          margin-right: 14px;
          margin-inline-start: initial;
          margin-inline-end: 14px;
        }
        .main div {
          line-height: 0.9;
        }
        .main span {
          font-size: 18px;
          color: var(--secondary-text-color);
        }
        .attributes {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          font-weight: 300;
          direction: ltr;
        }
        .chart-container {
          position: relative;
          height: ${config.forecast.chart_height}px;
          //width: 450px;
        }
        .forecast-container {
          max-width: 100%;
          direction: ltr;
        }
        .conditions {
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 0px 0px 0px ${config.forecast.labels_font_size / 2}px;
          cursor: pointer;
        }
        .forecast-item {
          //display: flex;
          //flex-direction: column;
          //align-items: center;
          //margin: 1px;
        }
        .wind-details {
          display: flex;
          justify-content: space-around;
          align-items: center;
          font-weight: 300;
          padding: 0px 0px 0px 10px;
        }
        .wind-detail {
          display: flex;
          align-items: center;
          margin: 1px;
          flex-wrap: wrap;
        }
        .wind-detail ha-icon {
          --mdc-icon-size: 15px;
          margin-right: 1px;
          margin-inline-start: initial;
          margin-inline-end: 1px;
        }
        .wind-icon {
          margin-right: 1px;
          margin-inline-start: initial;
          margin-inline-end: 1px;
          position: relative;
	        bottom: 1px;
        }
        .wind-speed {
          font-size: 11px;
          margin-right: 1px;
          margin-inline-start: initial;
          margin-inline-end: 1px;
        }
        .wind-unit {
          font-size: 9px;
          margin-left: 1px;
          margin-inline-start: 1px;
          margin-inline-end: initial;
        }
        .current-time {
          position: absolute;
          top: 20px;
          right: 16px;
          inset-inline-start: initial;
          inset-inline-end: 16px;
          font-size: ${config.time_size}px;
        }
        .date-text {
          font-size: ${config.day_date_size}px;
          color: var(--secondary-text-color);
        }
        .main .feels-like {
          font-size: 13px;
          margin-top: 5px;
          font-weight: 400;
        }
        .main .description {
	        font-style: italic;
          font-size: 13px;
          margin-top: 5px;
          font-weight: 400;
        }
        .updated {
          font-size: 13px;
          align-items: right;
          font-weight: 300;
          margin-bottom: 1px;
        }
      </style>

      <ha-card header="${config.title}">
        <div class="card">
          ${this.renderMain()}
          ${this.renderAttributes()}
          <div class="forecast-container">
            <div class="chart-container">
              <canvas id="forecastCanvas"></canvas>
            </div>
            ${this.renderForecastConditionIcons()}
            ${this.renderWindForecast()}
          </div>
          ${this.renderLastUpdated()}
        </div>
      </ha-card>
    `;
  }

  renderMain({ config, sun, weather } = this) {
    if (config.show_main === false)
      return html``;

    const use12HourFormat = config.use_12hour_format;
    const showTime = config.show_time;
    const showDay = config.show_day;
    const showDate = config.show_date;
    const showSeconds = config.show_time_seconds === true;

    const temperature = config.show_temperature ? this.getCurrentWeatherAttribute('temperature') : undefined;
    const apparentTemperature = config.show_apparent_temperature ? this.getCurrentWeatherAttribute('apparent_temperature') : undefined;

    const iconHtml = config.animated_icons || config.icons
      ? html`<img src="${this.getWeatherIcon(weather.state, sun.state)}" alt="">`
      : html`<ha-icon icon="${this.getWeatherIcon(weather.state, sun.state)}"></ha-icon>`;

    const updateClock = () => {
      const currentDate = new Date();
      const timeOptions = {
        hour12: use12HourFormat,
        hour: 'numeric',
        minute: 'numeric',
        second: showSeconds ? 'numeric' : undefined
      };
      const currentTime = currentDate.toLocaleTimeString(this.language, timeOptions);
      const currentDayOfWeek = currentDate.toLocaleString(this.language, { weekday: 'long' }).toUpperCase();
      const currentDateFormatted = currentDate.toLocaleDateString(this.language, { month: 'long', day: 'numeric' });

      const mainDiv = this.shadowRoot.querySelector('.main');
      if (mainDiv) {
        const clockElement = mainDiv.querySelector('#digital-clock');
        if (clockElement) {
          clockElement.textContent = currentTime;
        }
        if (showDay) {
          const dayElement = mainDiv.querySelector('.date-text.day');
          if (dayElement) {
            dayElement.textContent = currentDayOfWeek;
          }
        }
        if (showDate) {
          const dateElement = mainDiv.querySelector('.date-text.date');
          if (dateElement) {
            dateElement.textContent = currentDateFormatted;
          }
        }
      }
    };

    updateClock();

    if (showTime) {
      setInterval(updateClock, 1000);
    }

    const current_condition = config.show_current_condition ? this.ll(weather.state) : undefined;
    const description = config.show_description ? this.getCurrentWeatherAttribute('description') : undefined;

    return html`
    <div class="main">
      ${iconHtml}
      <div>
        <div>
          ${temperature ? html`${temperature.toFixed(0)}<span>${this.getUnit('temperature')}</span>` : ''}
          ${apparentTemperature ? html`<div class="feels-like">${this.ll('feelsLike')}${apparentTemperature.toFixed(0)}${this.getUnit('temperature')}</div>` : ''}
          ${current_condition ? html`
            <div class="current-condition">
              <span>${current_condition}</span>
            </div>
          ` : ''}
          ${description ? html`
            <div class="description">
              ${description}
            </div>
          ` : ''}
        </div>
        ${showTime ? html`
          <div class="current-time">
            <div id="digital-clock"></div>
            ${showDay ? html`<div class="date-text day"></div>` : ''}
            ${showDay && showDate ? html` ` : ''}
            ${showDate ? html`<div class="date-text date"></div>` : ''}
          </div>
        ` : ''}
      </div>
    </div>
  `;
  }

  convertSpeed(input, inputUnit, outputUnit = this.config.units.speed) {
    input = parseFloat(input);
    let output = input, outputPrecision = 0;

    if (typeof inputUnit === 'undefined') {
      console.warn(`Unable to convert because the input unit is undefined`);
    } else if (outputUnit === inputUnit) {
      output = input;
    } else if (outputUnit === 'm/s') {
      if (inputUnit === 'km/h') {
        output = input * 1000 / 3600;
      } else if (inputUnit === 'mph') {
        output = input * 0.44704;
      }
    } else if (outputUnit === 'km/h') {
      if (inputUnit === 'm/s') {
        output = input * 3.6;
      } else if (inputUnit === 'mph') {
        output = input * 1.60934;
      }
    } else if (outputUnit === 'mph') {
      if (inputUnit === 'm/s') {
        output = input / 0.44704;
      } else if (inputUnit === 'km/h') {
        output = input / 1.60934;
      }
    } else if (outputUnit === 'Bft') {
      output = this.calculateBeaufortScale(input, inputUnit);
    } else {
      console.warn(`Unable to convert to ${outputUnit}`);
      output = input;
    }
    return output.toFixed(outputPrecision);
  }

  convertPressure(input, inputUnit, outputUnit = this.config.units.pressure) {
    input = parseFloat(input);
    let output, outputPrecision = 0;
    if (typeof inputUnit === 'undefined') {
      console.warn(`Unable to convert because the input unit is undefined`);
      output = input;
    } else if (outputUnit === 'mmHg') {
      outputPrecision = 0;
      if (inputUnit === outputUnit) {
        output = input;
      } else if (inputUnit === 'hPa') {
        output = Math.round(input * 0.75006);
      } else if (inputUnit === 'inHg') {
        output = Math.round(input * 25.4);
      }
    } else if (outputUnit === 'hPa') {
      outputPrecision = 0;
      if (inputUnit === 'mmHg') {
        output = Math.round(input / 0.75006);
      } else if (inputUnit === 'inHg') {
        output = Math.round(input * 33.8639);
      }
    } else if (outputUnit === 'inHg') {
      outputPrecision = 2;
      if (inputUnit === 'mmHg') {
        output = input / 25.4;
      } else if (inputUnit === 'hPa') {
        output = input / 33.8639;
      }
    } else {
      console.warn(`Unable to convert to ${outputUnit}`);
      output = input;
    }
    return output.toFixed(outputPrecision);
  }

  convertDistance(input, inputUnit, outputUnit = this.config.units.distance) {
    input = parseFloat(input);
    let output, outputPrecision = 1;
    if (typeof inputUnit === 'undefined') {
      console.warn(`Unable to convert because the input unit is undefined`);
      output = input;
    } else {
      console.warn(`Unable to convert to ${outputUnit}`);
      output = input;
    }
    return output.toFixed(outputPrecision);
  }

  renderAttributes({ config, sun, language, option1, option2, option3 } = this) {
    if (config.show_attributes == false)
      return html``;

    const wind_speed = config.show_wind_speed ? `${this.convertSpeed(
      this.getCurrentWeatherAttribute('wind_speed'),
      this.getCurrentWeatherAttribute('wind_speed_unit'),
      this.config.units.speed)} ${this.ll('units')[this.config.units.speed]}` : undefined;

    const wind_gust_speed = config.show_wind_gust_speed ? `${this.convertSpeed(
      this.getCurrentWeatherAttribute('wind_gust_speed'),
      this.getCurrentWeatherAttribute('wind_gust_speed_unit'),
      this.config.units.speed)} ${this.ll('units')[this.config.units.speed]}` : undefined;

    const pressure = config.show_pressure ? `${this.convertPressure(
      this.getCurrentWeatherAttribute('pressure'),
      this.getCurrentWeatherAttribute('pressure_unit'),
      this.config.units.pressure)} ${this.ll('units')[this.config.units.pressure]}` : undefined;
    
    const visibility = config.show_visibility ? `${this.convertDistance(
      this.getCurrentWeatherAttribute('visibility'),
      this.getCurrentWeatherAttribute('visibility_unit'),
      this.config.units.distance)} ${this.ll('units')[this.config.units.distance]}` : undefined;

    const humidity = config.show_humidity ? this.getCurrentWeatherAttribute('humidity') : undefined;
    const wind_bearing = config.show_wind_bearing ? this.getCurrentWeatherAttribute('wind_bearing') : undefined;
    const uv_index = config.show_uv_index ? this.getCurrentWeatherAttribute('uv_index') : undefined;
    const dew_point = config.show_dew_point ? this.getCurrentWeatherAttribute('dew_point') : undefined;

    const showSun = config.show_sun !== false;

    return html`
    <div class="attributes">
      ${(humidity !== undefined || pressure !== undefined || dew_point !== undefined || visibility !== undefined) ? html`
        <div>
          ${humidity !== undefined ? html`
            <ha-icon icon="hass:water-percent"></ha-icon> ${humidity} %<br>
          ` : ''}
          ${pressure !== undefined ? html`
            <ha-icon icon="hass:gauge"></ha-icon> ${pressure} <br>
          ` : ''}
          ${dew_point !== undefined ? html`
            <ha-icon icon="hass:thermometer-water"></ha-icon> ${dew_point} ${this.weather.attributes.temperature_unit} <br>
          ` : ''}
          ${visibility !== undefined ? html`
            <ha-icon icon="hass:eye"></ha-icon> ${visibility} <br>
          ` : ''}
          ${option1 ? html`${option1.attributes.friendly_name} ${option1.state} ${option1.attributes.unit_of_measurement}` : ''}
	</div>
      ` : ''}
      ${((showSun && sun !== undefined) || uv_index !== undefined) ? html`
        <div>
          ${uv_index !== undefined ? html`
            <div>
              <ha-icon icon="hass:white-balance-sunny"></ha-icon> UV: ${uv_index}
            </div>
          ` : ''}
          ${showSun && sun !== undefined ? html`
            <div>
              ${this.renderSun({ sun, language })}
            </div>
          ` : ''}
          ${option2 ? html`${option2.attributes.friendly_name} ${option2.state} ${option2.attributes.unit_of_measurement}` : ''}
	</div>
      ` : ''}
      ${(wind_bearing !== undefined || wind_speed !== undefined) ? html`
        <div>
          ${wind_bearing !== undefined ? html`
            <ha-icon icon="hass:${this.getWindDirIcon(wind_bearing)}"></ha-icon> ${this.getWindDir(wind_bearing)} <br>
          ` : ''}
          ${wind_speed !== undefined ? html`
            <ha-icon icon="hass:weather-windy"></ha-icon>
            ${wind_speed} <br>
          ` : ''}
          ${wind_gust_speed !== undefined ? html`
            <ha-icon icon="hass:weather-windy-variant"></ha-icon>
            ${wind_gust_speed} <br>
          ` : ''}
          ${option3 ? html`${option3.attributes.friendly_name} ${option3.state} ${option3.attributes.unit_of_measurement}` : ''}
	</div>
      ` : ''}
    </div>
`;
  }

  renderSun({ sun, language, config } = this) {
    if (sun == undefined) {
      return html``;
    }

    const use12HourFormat = this.config.use_12hour_format;
    const timeOptions = {
      hour12: use12HourFormat,
      hour: 'numeric',
      minute: 'numeric'
    };

    return html`
    <ha-icon icon="mdi:weather-sunset-up"></ha-icon>
      ${new Date(sun.attributes.next_rising).toLocaleTimeString(language, timeOptions)}<br>
    <ha-icon icon="mdi:weather-sunset-down"></ha-icon>
      ${new Date(sun.attributes.next_setting).toLocaleTimeString(language, timeOptions)}
  `;
  }

  renderForecastConditionIcons({ config, forecastItems, sun } = this) {
    const forecast = this.forecast ? this.forecast.slice(0, forecastItems) : [];

    if (config.forecast.condition_icons === false) {
      return html``;
    }

    return html`
    <div class="conditions" @click="${(e) => this.showMoreInfo(config.entity)}">
      ${forecast.map((item) => {
      const forecastTime = new Date(item.datetime);
      const sunriseTime = new Date(sun.attributes.next_rising);
      const sunsetTime = new Date(sun.attributes.next_setting);

      // Adjust sunrise and sunset times to match the date of forecastTime
      const adjustedSunriseTime = new Date(forecastTime);
      adjustedSunriseTime.setHours(sunriseTime.getHours());
      adjustedSunriseTime.setMinutes(sunriseTime.getMinutes());
      adjustedSunriseTime.setSeconds(sunriseTime.getSeconds());

      const adjustedSunsetTime = new Date(forecastTime);
      adjustedSunsetTime.setHours(sunsetTime.getHours());
      adjustedSunsetTime.setMinutes(sunsetTime.getMinutes());
      adjustedSunsetTime.setSeconds(sunsetTime.getSeconds());

      let isDayTime;

      if (config.forecast.type === 'daily') {
        // For daily forecast, assume it's day time
        isDayTime = true;
      } else {
        // For other forecast types, determine based on sunrise and sunset times
        isDayTime = forecastTime >= adjustedSunriseTime && forecastTime <= adjustedSunsetTime;
      }

      const weatherIcons = isDayTime ? weatherIconsDay : weatherIconsNight;
      const condition = item.condition;

      let iconHtml;

      if (config.animated_icons || config.icons) {
        const iconSrc = config.animated_icons ?
          `${this.baseIconPath}${weatherIcons[condition]}.svg` :
          `${this.config.icons}${weatherIcons[condition]}.svg`;
        iconHtml = html`<img class="icon" src="${iconSrc}" alt="">`;
      } else {
        iconHtml = html`<ha-icon icon="${this.getWeatherIcon(condition, sun.state)}"></ha-icon>`;
      }

      return html`
          <div class="forecast-item">
            ${iconHtml}
          </div>
        `;
    })}
    </div>
  `;
  }

  renderWindForecast({ config, forecastItems } = this) {
    const showWindForecast = config.forecast.show_wind_forecast !== false;

    if (!showWindForecast) {
      return html``;
    }

    const forecast = this.forecast ? this.forecast.slice(0, forecastItems) : [];

    return html`
      <div class="wind-details">${forecast.map(item => html`
        <div class="wind-detail">
          <ha-icon class="wind-icon" icon="hass:${this.getWindDirIcon(item.wind_bearing)}"></ha-icon>
          <span class="wind-speed">${this.convertSpeed(item.wind_speed)}</span>
        </div>`)}
      </div>
    `;
  }

  renderLastUpdated() {
    const lastUpdatedString = this.weather.last_changed;
    const lastUpdatedTimestamp = new Date(lastUpdatedString).getTime();
    const currentTimestamp = Date.now();
    const timeDifference = currentTimestamp - lastUpdatedTimestamp;

    const minutesAgo = Math.floor(timeDifference / (1000 * 60));
    const hoursAgo = Math.floor(minutesAgo / 60);

    const locale = this.language;

    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    let formattedLastUpdated;

    if (hoursAgo > 0) {
      formattedLastUpdated = formatter.format(-hoursAgo, 'hour');
    } else {
      formattedLastUpdated = formatter.format(-minutesAgo, 'minute');
    }

    const showLastUpdated = this.config.show_last_changed == true;

    if (!showLastUpdated) {
      return html``;
    }

    return html`
      <div class="updated">
        <div>
          ${formattedLastUpdated}
        </div>
      </div>
    `;
  }

  _fire(type, detail, options) {
    const node = this.shadowRoot;
    options = options || {};
    detail = (detail === null || detail === undefined) ? {} : detail;
    const event = new Event(type, {
      bubbles: options.bubbles === undefined ? true : options.bubbles,
      cancelable: Boolean(options.cancelable),
      composed: options.composed === undefined ? true : options.composed
    });
    event.detail = detail;
    node.dispatchEvent(event);
    return event;
  }

  showMoreInfo(entity) {
    this._fire('hass-more-info', { entityId: entity });
  }
}

customElements.define('htrn-weather-chart-card', HTRNWeatherChartCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "htrn-weather-chart-card",
  name: "HTRN Weather Chart Card",
  description: "A custom weather card with chart.",
  preview: true,
  documentationURL: "https://github.com/fancygaphtrn/htrn-weather-chart-card",
});
