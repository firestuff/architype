function randStr32() {
  let num = Math.floor(Math.random() * Math.pow(2, 32));
  return num.toString(16).padStart(8, '0');
}

function randStr64() {
  return randStr32() + randStr32();
}

function getOrSet(container, key, newValue) {
  let val = container.get(key);
  if (!val) {
    val = newValue;
    container.set(key, val);
  }
  return val;
}

function intersects(set1, set2) {
  for (let item of set1) {
    if (set2.has(item)) {
      return true;
    }
  }
  return false;
}

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
