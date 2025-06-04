class Message {
  constructor({ id, flagMy, created, geo, objList }, file) {
    this.id = id;    
    this.flagMy = flagMy;
    this.created = created;
    this.geo = geo;
    this.objList = objList;
    this.file = file;    
  }
}

module.exports = {
  Message,
}
