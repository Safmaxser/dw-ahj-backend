const fs = require('fs');
const path = require('path');

class DBFile {
  constructor(dirPublic) {
    this.dirPublic = dirPublic; 
    this.createDirPublic();
  }

  createDirPublic() {
    if (!fs.existsSync(this.dirPublic)) {
      fs.mkdirSync(this.dirPublic); 
    }
    const createdFolder = path.join(this.dirPublic, 'repositoryfile');
    if (!fs.existsSync(createdFolder)) {
      fs.mkdirSync(createdFolder); 
    }
  }   
  
  saveDataToDB() {
    fs.writeFileSync('data.json', JSON.stringify(this.data));
  }
}

module.exports = {
  DBFile,
}
