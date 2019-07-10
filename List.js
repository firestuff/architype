class List {
  constructor(container) {
    this.container_ = container;
  }

  getEntries(type) {
    let ret = [];
    for (let elem of this.container_.children) {
      if (type && !(elem.xArchObj instanceof type)) {
        continue;
      }
      ret.push(elem.xArchObj);
    }
    return ret;
  }

  getSelected() {
    let iter = document.activeElement;
    while (iter) {
      if (iter.parentElement == this.container_) {
        return iter;
      }
      iter = iter.parentElement;
    }
    return null;
  }

  mayDelete(type) {
    return true;
  }

  deleteSelected() {
    let sel = this.getSelected();
    if (sel && this.mayDelete(sel.xArchObj.constructor)) {
      sel.xArchObj.remove();
    }
  }

  deleteSelectedAndAfter() {
    let sel = this.getSelected();
    if (!sel) {
      return;
    }
    let iter = this.container_.lastElementChild;
    while (iter != sel) {
      let next = iter.previousElementSibling;
      if (this.mayDelete(iter.xArchObj.constructor)) {
        iter.xArchObj.remove();
      }
      iter = next;
    }
    this.deleteSelected();
  }

  selectNext() {
    let sel = this.getSelected() || this.container_.lastElementChild;
    if (sel) {
      this.select(sel.nextElementSibling ||
                  this.container_.firstElementChild);
    }
  }

  selectPrev() {
    let sel = this.getSelected() || this.container_.firstElementChild;
    if (sel) {
      this.select(sel.previousElementSibling ||
                  this.container_.lastElementChild);
    }
  }

  selectPrevPage() {
    let targetTop = this.container_.scrollTop - this.container_.clientHeight;
    let sel = this.getSelected() || this.container_.lastElementSibling;
    if (sel) {
      while (sel.previousElementSibling &&
             this.container_.scrollTop > targetTop) {
        sel = sel.previousElementSibling;
        this.select(sel);
      }
    }
  }

  selectNextPage() {
    let targetTop = this.container_.scrollTop + this.container_.clientHeight;
    let sel = this.getSelected() || this.container_.firstElementSibling;
    if (sel) {
      while (sel.nextElementSibling && this.container_.scrollTop < targetTop) {
        sel = sel.nextElementSibling;
        this.select(sel);
      }
    }
  }

  selectFirst() {
    this.select(this.container_.firstElementChild);
  }

  selectLast() {
    this.select(this.container_.lastElementChild);
  }

  select(elem) {
    if (!elem) {
      return;
    }
    elem.focus();
  }

  onKeyDown(e) {
    switch (e.key) {
      case 'Escape':
      case 'ArrowLeft':
      case 'h':
        if (this.container_.parentElement.xArchObj) {
          this.container_.parentElement.focus();
        }
        break;

      case 'd':
        this.deleteSelected();
        e.stopPropagation();
        e.preventDefault();
        break;

      case 'D':
        this.deleteSelectedAndAfter();
        e.stopPropagation();
        e.preventDefault();
        break;

      case 'j':
      case 'ArrowDown':
        this.selectNext();
        e.stopPropagation();
        e.preventDefault();
        break;

      case 'k':
      case 'ArrowUp':
        this.selectPrev();
        e.stopPropagation();
        e.preventDefault();
        break;

      case 'PageUp':
        this.selectPrevPage();
        e.stopPropagation();
        e.preventDefault();
        break;

      case 'PageDown':
        this.selectNextPage();
        e.stopPropagation();
        e.preventDefault();
        break;

      case 'Home':
        this.selectFirst();
        e.stopPropagation();
        e.preventDefault();
        break;

      case 'End':
        this.selectLast();
        e.stopPropagation();
        e.preventDefault();
        break;
    }
  }
}
