function getOrSet(container, key, newValue) {
  let val = container.get(key);
  if (!val) {
    val = newValue;
    container.set(key, val);
  }
  return val;
}

<!--# include file="MinHeap.js" -->
<!--# include file="StringMap.js" -->
