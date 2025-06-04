const { faker } = require('@faker-js/faker');
const { evaluate } = require('mathjs');
const moment = require('moment');
const { Weather } = require('./Weather');
const { Wisdom } = require('./Wisdom');

function getRandomInRage(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

class BotResponse {
  constructor(processMessage, dbFile) {
    this.processMessage = processMessage;
    this.dbFile = dbFile;
    this.listenersNotify = [];
    this.notifyIntevalID = null;
    this.notifyTimerStart();
  }

  subscribersNotify(notify) {
    this.listenersNotify.forEach((handler) => handler(notify));
  }

  notifyTimerStart() {
    if (!this.notifyIntevalID) {
      if (this.dbFile.data.notifications.length === 0) {
        return;
      }
      this.notifyIntevalID = setInterval(() => {
        if (this.dbFile.data.notifications.length > 0) {
          const findIndex = this.dbFile.data.notifications.findIndex(
            (notify) => notify.date <= moment().unix()
          );
          if (findIndex > -1) {
            this.subscribersNotify({
              action: 'notification',
              data: this.dbFile.data.notifications[findIndex].data,
            });
            this.createNotifyShowMessage(
              this.dbFile.data.notifications[findIndex].data
            );
            this.dbFile.data.notifications.splice(findIndex, 1);
            this.dbFile.saveDataToDB();
            if (this.dbFile.data.notifications.length === 0) {
              this.notifyTimerStop();
            }
          }
        }
      }, 10000);
    }
  }

  notifyTimerStop() {
    if (this.notifyIntevalID) {
      clearInterval(this.notifyIntevalID);
      this.notifyIntevalID = null;
    }
  }

  createNotifyShowMessage(data) {
    this.processMessage({
      id: crypto.randomUUID(),
      flagMy: false,
      created: String(Date.now()),
      geo: '',
      objList: [
        {
          type: 'text',
          data: {
            text: `Напоминание от CHAOS за ${data.date}:`,
          },
        },
        {
          type: 'image',
          data,
        },
      ],
    });
  }

  createNotifySaveMessage(notify) {
    this.processMessage({
      id: crypto.randomUUID(),
      flagMy: false,
      created: String(Date.now()),
      geo: '',
      objList: [
        {
          type: 'text',
          data: {
            text:
              'Для отображения напоминания – Как уведомления<br>' +
              '⬆⬆⬆ Необходимо разрешить уведомления!',
          },
        },
        {
          type: 'text',
          data: {
            text:
              'Напоминание сохранено, и будет выведено<br>' +
              `${notify.data.date} или позже при возможности!`,
          },
        },
        {
          type: 'image',
          data: notify.data,
        },
      ],
    });
  }

  commandRecognition(text, file) {
    this.commandRecognitionSchedule(text, file);
    this.commandRecognitionChaos(text);
  }

  dateTimeRecognition(restCodeList) {
    if (restCodeList < 2) {
      return;
    }
    let firstValue = restCodeList[0];
    let secondValue = restCodeList[1];
    let flagOK = false;
    if (firstValue.length === 5 && secondValue.length === 10) {
      flagOK = true;
    }
    if (firstValue.length === 10 && secondValue.length === 5) {
      const value = firstValue;
      firstValue = secondValue;
      secondValue = value;
      flagOK = true;
    }
    if (flagOK) {
      const dateList = secondValue.split(/\.|\/|\\|\-/);
      if (dateList[0].length === 2) {
        dateList.reverse();
      }
      const date = moment(`${dateList.join('-')} ${firstValue}`);
      if (date.isValid()) {
        return date.unix();
      }
      return null;
    }
  }

  commandRecognitionSchedule(text, file) {
    if (text.slice(0, 10).toLowerCase() === '@schedule:') {
      const restCode = text.slice(10).trim();
      const restCodeList = restCode.split(' ').filter((item) => item !== '');
      const date = this.dateTimeRecognition(restCodeList);
      if (date) {
        const text = restCodeList.slice(2).join(' ');
        const notify = {
          date: date, 
          data: {
            id: crypto.randomUUID(),
            date: moment.unix(date).format('HH:mm DD.MM.YYYY'),
            text,
          },
        };
        if (file) {
          const fileType = file.type.split('/');
          if (fileType[0] === 'image') {
            notify.data.imagePath = file.path;
          }
        }
        this.subscribersNotify({
          action: 'permissions',
        });
        this.dbFile.data.notifications.push(notify);
        this.notifyTimerStart();
        this.dbFile.saveDataToDB();
        this.createNotifySaveMessage(notify);
      }
    }
  }

  commandRecognitionChaos(text) {
    const strCode = text.toLowerCase();
    if (strCode.startsWith('@chaos:')) {
      const restCode = strCode.slice(7).trim();
      const restCodeList = restCode
        .split(' ')
        .map((item) => item.trim())
        .filter((item) => item !== '');
      if (restCode === '') {
        this.noCommands();
      } else {
        switch (restCodeList[0]) {
          case 'фото':
            this.commandChaosPhoto();
            break;
          case 'реши':
            this.commandChaosSolve(restCodeList);
            break;
          case 'цитата':
            this.commandChaosQuote();
            break;
          case 'предсказание':
            this.commandChaosPrediction();
            break;
          case 'инфо':
            this.commandChaosInfo();
            break;
          case 'погода':
            this.commandChaosWeather(restCodeList);
            break;
          default:
            this.commandNotRecognized(restCode);
            break;
        }
      }
    }
  }

  noCommands() {
    this.processMessage({
      id: crypto.randomUUID(),
      flagMy: false,
      created: String(Date.now()),
      geo: '',
      objList: [
        {
          type: 'text',
          data: {
            text: 'Введите после "@chaos:" команду!<br>' +
              'Если хотите больше узнать о командах, введите "@chaos: инфо"',
          },
        },
      ],
    });
  }
  
  commandChaosInfo() {
    this.processMessage({
      id: crypto.randomUUID(),
      flagMy: false,
      created: String(Date.now()),
      geo: '',
      objList: [
        {
          type: 'text',
          data: {
            text: 'Инфо:<hr>' +
              'Набирайте после "@chaos:" одну из команд:\n' +
              '[Погода, Фото, Цитата, Предсказание, Реши]\n' + 
              'После команды "Реши" напишите арифметическое уравнение',
          },
        },
      ],
    });
  }

  commandChaosQuote() {
    const num = getRandomInRage(0, Wisdom.quote.length - 1);
    this.processMessage({
      id: crypto.randomUUID(),
      flagMy: false,
      created: String(Date.now()),
      geo: '',
      objList: [
        {
          type: 'text',
          data: {
            text: 'Цитата:<hr>' + Wisdom.quote[num],
          },
        },
      ],
    });
  }

  commandChaosPrediction() {
    const num = getRandomInRage(0, Wisdom.prediction.length - 1);
    this.processMessage({
      id: crypto.randomUUID(),
      flagMy: false,
      created: String(Date.now()),
      geo: '',
      objList: [
        {
          type: 'text',
          data: {
            text: 'Предсказание:<hr>' + Wisdom.prediction[num],
          },
        },
      ],
    });
  }

  commandChaosSolve(restCodeList) {
    const example = restCodeList.slice(1).join(' ');
    let response;
    try {
      response = evaluate(example);
    } catch (error) {
      response = null;
    }
    let text;
    if (response) {
      text = `Решение:<hr>${example} = ${response}`;
    } else {
      text = `На пример "${example}" получить решение не удалось!`;
    }
    this.processMessage({
      id: crypto.randomUUID(),
      flagMy: false,
      created: String(Date.now()),
      geo: '',
      objList: [
        {
          type: 'text',
          data: {
            text,
          },
        },
      ],
    });
  }

  commandChaosPhoto() {
    this.processMessage({
      id: crypto.randomUUID(),
      flagMy: false,
      created: String(Date.now()),
      geo: '',
      objList: [
        {
          type: 'image',
          data: {
            title: 'Фото',
            image: faker.image.personPortrait(),
          },
        },
      ],
    });
  }

  commandChaosWeather(restCodeList) {
    let city;
    if (restCodeList.length === 1) {
      city = 'Москва';
    } else {
      city = restCodeList[1];
    }
    Weather.getInfo(city)
      .then((result) => {
        this.processMessage({
          id: crypto.randomUUID(),
          flagMy: false,
          created: String(Date.now()),
          geo: '',
          objList: [
            {
              type: 'text',
              data: {
                text: result,
              },
            },
          ],
        });
      })
      .catch(() => {
        this.processMessage({
          id: crypto.randomUUID(),
          flagMy: false,
          created: String(Date.now()),
          geo: '',
          objList: [
            {
              type: 'text',
              data: {
                text: `Город "${city}" не распознан!`,
              },
            },
          ],
        });
      });
  }

  commandNotRecognized(restCode) {
    this.processMessage({
      id: crypto.randomUUID(),
      flagMy: false,
      created: String(Date.now()),
      geo: '',
      objList: [
        {
          type: 'text',
          data: {
            text: `Команда "${restCode}" не распознана!`,
          },
        },
      ],
    });
  }
}

module.exports = {
  BotResponse,
};
