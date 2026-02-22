// ===== DOM Elements =====
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('results');
const clearBtn = document.getElementById('clearBtn');

// ===== Global State =====
let countries = [];

// OpenWeather API Key
const WEATHER_API_KEY = 'f21c97d80fa998f9df9fef2f6f27c42f';

// ===== 1. Fetch all countries from REST Countries API =====
async function fetchCountries() {
    resultsContainer.innerHTML = `
        <div class="message">
            <div class="spinner" style="margin: 0 auto 15px auto; width: 30px; height: 30px; border: 3px solid rgba(129,140,248,0.2); border-top: 3px solid #818cf8; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <h3>Cargando base de datos...</h3>
            <p>Obteniendo información de los países del mundo</p>
        </div>
    `;

    try {
        const FIELDS = 'name,flags,capital,population,region,subregion,languages,currencies,translations';
        const PRIMARY_URL = `https://restcountries.com/v3.1/all?fields=${FIELDS}`;
        const FALLBACK_URL = `https://restcountries.com/v3.1/all`;

        let response = await fetch(PRIMARY_URL);
        if (!response.ok) {
            console.warn(`URL principal falló (${response.status}), usando fallback...`);
            response = await fetch(FALLBACK_URL);
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        countries = await response.json();
        console.log(`${countries.length} países cargados con éxito.`);

        resultsContainer.innerHTML = '';

        countries.sort((a, b) => {
            const nameA = a.name?.common || '';
            const nameB = b.name?.common || '';
            return nameA.localeCompare(nameB);
        });

    } catch (error) {
        console.error('Error al cargar los países:', error);
        resultsContainer.innerHTML = `
            <div class="message">
                <span class="message-icon">⚠️</span>
                <h3>Error de conexión</h3>
                <p>No se pudieron cargar los países (${error.message}). Verifica tu conexión e intenta de nuevo.</p>
            </div>
        `;
    }
}

// ===== 2. Input event listener with debounce =====
let debounceTimer;

searchInput.addEventListener('input', (e) => {
    const value = e.target.value;
    clearBtn.style.display = value.length > 0 ? 'flex' : 'none';

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const searchTerm = value.toLowerCase().trim();

        if (!searchTerm) {
            resultsContainer.innerHTML = '';
            return;
        }

        if (countries.length === 0) {
            resultsContainer.innerHTML = `
                <div class="message">
                    <span class="message-icon">⏳</span>
                    <h3>Aún cargando...</h3>
                    <p>Espera un segundo mientras se descarga la lista de países.</p>
                </div>
            `;
            return;
        }

        // Filtrar países que COMIENCEN con el término buscado
        const filteredCountries = countries.filter(country => {
            if (!country || !country.name) return false;
            const nameCommon = (country.name.common || '').toLowerCase();
            const nameSpa = (country.translations?.spa?.common || '').toLowerCase();
            const nameOfficial = (country.name.official || '').toLowerCase();
            return nameCommon.startsWith(searchTerm) ||
                nameSpa.startsWith(searchTerm) ||
                nameOfficial.startsWith(searchTerm);
        });

        renderResults(filteredCountries);
    }, 250);
});

// Clear button
clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    resultsContainer.innerHTML = '';
    searchInput.focus();
});

// ===== 3. Lógica de renderizado según cantidad de países =====
function renderResults(filtered) {
    resultsContainer.innerHTML = '';

    if (filtered.length === 0) {
        // Sin resultados
        resultsContainer.innerHTML = `
            <div class="message">
                <span class="message-icon">🔍</span>
                <h3>No se encontraron países</h3>
                <p>Intenta con otro nombre o revisa la ortografía</p>
            </div>
        `;

    } else if (filtered.length >= 10) {
        // 10 o más → pedir búsqueda más específica
        resultsContainer.innerHTML = `
            <div class="message">
                <span class="message-icon">🌍</span>
                <h3>Demasiados resultados (${filtered.length} países)</h3>
                <p>Sé más específico en tu búsqueda</p>
            </div>
        `;

    } else if (filtered.length > 1) {
        // Entre 2 y 9 → cartas con nombre y bandera
        filtered.forEach(country => {
            const card = document.createElement('div');
            card.className = 'country-card';
            card.innerHTML = `
                <img src="${country.flags.svg}" alt="Bandera de ${country.name.common}">
                <div class="card-body">
                    <h3>${country.name.common}</h3>
                </div>
            `;
            card.addEventListener('click', () => {
                searchInput.value = country.name.common;
                renderSingleCountry(country);
            });
            resultsContainer.appendChild(card);
        });

    } else if (filtered.length === 1) {
        // Un solo país → nombre, bandera, capital, habitantes, región, temperatura y clima
        renderSingleCountry(filtered[0]);
    }
}

// ===== 4. Renderizar un solo país con clima =====
async function renderSingleCountry(country) {
    const name = country.name.common;
    const flag = country.flags.svg;
    const capital = country.capital ? country.capital[0] : 'No tiene';
    const population = new Intl.NumberFormat('es-ES').format(country.population);
    const region = country.region || 'N/A';
    const subregion = country.subregion || 'N/A';
    const languages = country.languages ? Object.values(country.languages).join(', ') : 'N/A';
    const currencies = country.currencies
        ? Object.values(country.currencies).map(c => `${c.name} (${c.symbol || ''})`).join(', ')
        : 'N/A';

    resultsContainer.innerHTML = `
        <div class="single-country">
            <img class="single-country-flag" src="${flag}" alt="Bandera de ${name}">
            <div class="single-country-info">
                <h2>${name}</h2>
                <div class="info-row">
                    <span class="info-label">Capital</span>
                    <span class="info-value">${capital}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Habitantes</span>
                    <span class="info-value">${population}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Región</span>
                    <span class="info-value">${region}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Subregión</span>
                    <span class="info-value">${subregion}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Idiomas</span>
                    <span class="info-value">${languages}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Moneda</span>
                    <span class="info-value">${currencies}</span>
                </div>
                <div id="weather-container" class="weather-info">
                    <div class="weather-loading">
                        <span class="spinner"></span> Cargando clima...
                    </div>
                </div>
            </div>
        </div>
    `;

    // Consultar API del clima
    if (capital !== 'No tiene' && WEATHER_API_KEY) {
        try {
            const weatherRes = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(capital)}&appid=${WEATHER_API_KEY}&units=metric&lang=es`
            );

            const weatherContainer = document.getElementById('weather-container');
            if (!weatherContainer) return;

            if (weatherRes.ok) {
                const data = await weatherRes.json();
                const temp = Math.round(data.main.temp);
                const feelsLike = Math.round(data.main.feels_like);
                const description = data.weather[0].description;
                const iconCode = data.weather[0].icon;
                const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
                const humidity = data.main.humidity;

                weatherContainer.innerHTML = `
                    <div class="weather-icon-wrapper">
                        <img src="${iconUrl}" alt="${description}">
                    </div>
                    <div class="weather-details">
                        <span class="weather-label">Clima actual en ${capital}</span>
                        <span class="weather-temp">${temp}°C</span>
                        <span class="weather-desc">${description} · Sensación ${feelsLike}°C · Humedad ${humidity}%</span>
                    </div>
                `;
            } else {
                document.getElementById('weather-container').innerHTML =
                    `<div class="weather-loading">⚠️ No se pudo obtener el clima para ${capital}</div>`;
            }
        } catch (error) {
            const wc = document.getElementById('weather-container');
            if (wc) wc.innerHTML = `<div class="weather-loading">⚠️ Error de conexión al servicio de clima</div>`;
        }
    } else {
        const wc = document.getElementById('weather-container');
        if (wc) wc.innerHTML = `<div class="weather-loading">Este país no tiene capital registrada</div>`;
    }
}

// ===== Inicializar =====
fetchCountries();
