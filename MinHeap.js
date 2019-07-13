class MinHeap {
  constructor(valueFunc=(a) => a) {
    this.valueFunc_ = valueFunc;
    this.data_ = [];
  }

  push(...vals) {
    for (let val of vals) {
      this.data_.push(val);
      this.bubbleUp_();
    }
  }

  pop() {
    let min = this.data_[0];
    if (this.data_.length > 1) {
      this.data_[0] = this.data_.pop();
      this.bubbleDown_();
    } else {
      this.data_.length = 0;
    }
    return min;
  }

  bubbleUp_() {
    for (let idx = this.data_.length - 1; idx > 0;) {
      let parent = Math.floor((idx + 1) / 2) - 1;
    
      if (this.valueFunc_(this.data_[parent]) >
          this.valueFunc_(this.data_[idx])) {
        [this.data_[parent], this.data_[idx]] =
            [this.data_[idx], this.data_[parent]];
      }
    
      idx = parent;
    }
  }

  bubbleDown_() {
    for (let idx = 0;;) {
      let children = [
        (idx + 1) * 2,
        (idx + 1) * 2 - 1,
      ];
      let toSwap = idx;
    
      // Find the minimum value of the current node and its two children
      for (let child of children) {
        if (this.data_[child] != undefined &&
            this.valueFunc_(this.data_[child]) <
            this.valueFunc_(this.data_[toSwap])) {
          toSwap = child;
        }
      }
    
      if (toSwap == idx) {
        // Current node is smaller than both children; tree is correct
        break;
      }
    
      [this.data_[toSwap], this.data_[idx]] =
          [this.data_[idx], this.data_[toSwap]];
    
      idx = toSwap;
    }
  }
}
