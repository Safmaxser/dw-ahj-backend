const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const { DBFile } = require('./DBFile');
const { Message } = require('./Message');
const { File } = require('./File');
const { BotResponse } = require('./BotResponse');
const { Division } = require('./Division');

class DataRepository {
  constructor(dirPublic) {    
    this.dirPublic = dirPublic;    
    this.dbFile = new DBFile(this.dirPublic); 
    this.loadingData();
    this.botResponse = new BotResponse(this.processMessage.bind(this), this.dbFile);      
    this.listeners = [];  
  }  
  
  listenNotify(handler) {
    this.botResponse.listenersNotify.push(handler);
  }  

  parseDataFiles(data) {
    this.dbFile.data = { messages: [], notifications: data.notifications  };
    for (const item of data.messages) {
      this.dbFile.data.messages.push(new Message(item, item.file ? new File(item.file) : item.file));
    }
  }  

  loadingData() {    
    let data;
    if (fs.existsSync('./data.json')) {
      try {
        data = JSON.parse(fs.readFileSync('data.json', (err, data) => (data)));
        if (!data.messages) {
          data = { messages: [], notifications: [] };
        }  
      } catch (error) {
        data = { messages: [], notifications: [] };
      }    
    } else {
      data = { messages: [], notifications: [] };
    }
    this.parseDataFiles(data);  
  }   

  listen(handler) {
    this.listeners.push(handler);
  }  

  subscribersMessage(message) {
    this.listeners.forEach(handler => handler(message));
  }

  addMessage(messageData, file) {
    const message = new Message(messageData, file);
    this.dbFile.data.messages.push(message);
    this.dbFile.saveDataToDB();
    this.subscribersMessage(message);
  }

  processMessage(messageRequest, file = undefined) {    
    let fileResult = undefined;
    if (file) {
      fileResult = this.addFile(file);
    }
    if (messageRequest.flagMy) {
      Division.creatingTextLink(messageRequest.text).then(objList => {
        const newMessage = { ...messageRequest, objList };
        this.addMessage(newMessage, fileResult);
        this.botResponse.commandRecognition(messageRequest.text, fileResult);
      });       
    } else {
      this.addMessage(messageRequest, fileResult);
    }  
  }  

  addFile(file) {
    const subfolder = uuid.v4();
    const createdFolder = path.join(this.dirPublic, 'repositoryfile', subfolder);
    fs.mkdirSync(createdFolder); 
    const localPath = path.join(createdFolder, file.originalFilename);
    fs.copyFileSync(file.filepath, localPath);
    const filePath = '/repositoryfile/' + subfolder + '/' + file.originalFilename;
    const newFile = new File({
      name: file.originalFilename,
      size: file.size,
      type: file.mimetype,
      path: filePath,      
    })
    return newFile;
  }

  listShift(shift = 0) {
    return this.dbFile.data.messages.slice(-10 - shift, this.dbFile.data.messages.length - shift);
  }

  responseList(shift) {
    let start = this.dbFile.data.messages.length - shift - 10;
    start =  start < 0 ? 0 : start;
    const stop = this.dbFile.data.messages.length - shift;
    const messages = this.dbFile.data.messages.slice(start, stop);
    return {
      status: 'ok',
      type: 'list',
      position: { start, stop },
      messages,
    };
  }

  findMessage(id) {
    return this.dbFile.data.messages.findIndex(message => message.id === id);
  }

  listToId(id) {
    return this.dbFile.data.messages.slice(this.findMessage(id) + 1);
  }  

  searchByMessages(value) {
    const text = value.toLowerCase();
    const result = this.dbFile.data.messages.map(message => {  
      const result = message.objList
        .reduce((list, obj) => {
          if (obj.data) { 
            const listField = ['text', 'title', 'description', 'url', 'image'];
            for (const field of listField) {
              if (obj.data[field]) {
                const index = obj.data[field].toLowerCase().indexOf(text);
                if (index !== -1) {
                  list.push({
                    index: index,
                    text: obj.data[field],
                  });
                }
              }
            }
          }  
          return list;     
        }, [])
      if (result.length > 0) {
        return {
          id: message.id,
          created: message.created,
          listSearch: result,
        }
      } else {
        return undefined;
      }        
    });
    return result.filter(value => value);
  }  
}

module.exports = {
  DataRepository,
}
