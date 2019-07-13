function getOrSet(container, key, newValue) {
  let val = container.get(key);
  if (!val) {
    val = newValue;
    container.set(key, val);
  }
  return val;
}

function asymDifference(set1, set2) {
  let ret = new Set();
  for (let item of set1) {
    if (!set2.has(item)) {
      ret.add(item);
    }
  }
  return ret;
}

<!--# include file="MinHeap.js" -->
<!--# include file="StringMap.js" -->
