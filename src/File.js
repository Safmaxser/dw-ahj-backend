class File {
  constructor({ name, size, type, path }) {
    this.name = name;
    this.size = size;
    this.type = type;
    this.path = path;
  }
}

module.exports = {
  File,
}
