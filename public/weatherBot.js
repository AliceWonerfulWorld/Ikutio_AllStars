let url = "https://weather.tsukumijima.net/api/forecast/city/400010";

fetch(url)
    .then(function(response) {
        return response.json();
    })
    .then(function(weather) {
        console.log(weather);
         document.getElementById("publicTimeFormatted").lastElementChild.textContent = weather.publicTimeFormatted;
         document.getElementById("date").lastElementChild.textContent = weather.forecasts[1].date;
         document.getElementById("publishingOffice").lastElementChild.textContent = weather.publishingOffice;
         document.getElementById("title").lastElementChild.textContent = weather.title;
         document.getElementById("weatherType").lastElementChild.textContent = weather.forecasts[1]["image"].title;
         document.getElementById("text").lastElementChild.textContent = weather.forecasts[1]["detail"].weather;
         document.getElementById("tempAverage").lastElementChild.textContent = weather.forecasts[1]["temperature"].max.celsius + "度";
         document.getElementById("rainT00-06").lastElementChild.textContent = weather.forecasts[1]["chanceOfRain"].T00_06;
         document.getElementById("rainT06-12").lastElementChild.textContent = weather.forecasts[1]["chanceOfRain"].T06_12;
         document.getElementById("rainT12-18").lastElementChild.textContent = weather.forecasts[1]["chanceOfRain"].T12_18;
         document.getElementById("rainT18-24").lastElementChild.textContent = weather.forecasts[1]["chanceOfRain"].T18_24;
    });
