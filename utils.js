function randStr32() {
  let num = Math.floor(Math.random() * Math.pow(2, 32));
  return num.toString(16).padStart(8, '0');
}

function randStr64() {
  return randStr32() + randStr32();
}
