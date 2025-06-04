const moment = require('moment');

function firstToUC(str) {
  const strList = str.split('');
  strList[0] = strList[0].toUpperCase();
  return strList.join('');
}

class Weather {
  static api = {
    endpoint: 'https://api.openweathermap.org/data/2.5/',
    key: 'f6a79cd68aec8cd822a30293c69bb15f'
  }

  static async getInfo(data) {
    try {
      moment.locale('ru');      
      const res = await fetch(`${Weather.api.endpoint}weather?q=${data}&lang=ru&units=metric&appID=${Weather.api.key}`);
      const result = await res.json();
      let strResult = 'Погода:\n';
      strResult += firstToUC(moment().format('dddd D')) + ' ' + firstToUC(moment().format('MMMM YYYY')) + '<hr>';
      strResult += `${result.name}, ${result.sys.country}\n`;    
      strResult += `${Math.round(result.main.temp)}°C \n`;
      strResult += `( ${result.weather[0].description} )\n`;
      strResult += `Влажность: ${result.main.humidity} %\n`;
      strResult += `Ветер: ${result.wind.speed} км/ч`;
      return strResult;
    } catch (error) {
      throw new Error(error);
    }
  }
}

module.exports = {
  Weather,
}
