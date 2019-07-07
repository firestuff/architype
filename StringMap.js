class StringMap extends Map {
  has(key) {
    return super.has(key.toString());
  }

  get(key) {
    return super.get(key.toString());
  }

  set(key, value) {
    return super.set(key.toString(), value);
  }

  delete(key) {
    return super.delete(key.toString());
  }
}
