'use strict';

class Editor {
  constructor(container) {
    this.container_ = container;
  }

  getSelected() {
    return this.container_.getElementsByClassName('selected').item(0);
  }

  deleteSelected() {
    let sel = this.getSelected();
    let newSel = sel.nextElementSibling || sel.previousElementSibling;
    sel.remove();
    this.select(newSel);
  }

  deleteSelectedAndAfter() {
    let sel = this.getSelected();
    while (sel.nextElementSibling) {
      sel.nextElementSibling.remove();
    }
    let newSel = null;
    if (sel.previousElementSibling) {
      newSel = sel.previousElementSibling;
    }
    sel.remove();
    this.select(newSel);
  }

  selectNext() {
    this.select(this.getSelected().nextElementSibling ||
                this.container_.firstElementChild);
  }

  selectPrev() {
    this.select(this.getSelected().previousElementSibling ||
                this.container_.lastElementChild);
  }

  selectPrevPage() {
    let targetTop = this.container_.scrollTop - this.container_.clientHeight;
    let newSel = this.getSelected();
    while (newSel.previousElementSibling &&
           this.container_.scrollTop > targetTop) {
      newSel = newSel.previousElementSibling;
      this.select(newSel);
    }
  }

  selectNextPage() {
    let targetTop = this.container_.scrollTop + this.container_.clientHeight;
    let newSel = this.getSelected();
    while (newSel.nextElementSibling && this.container_.scrollTop < targetTop) {
      newSel = newSel.nextElementSibling;
      this.select(newSel);
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
    let sel = this.getSelected();
    if (sel) {
      sel.classList.remove('selected');
    }
    elem.classList.add('selected');
    elem.scrollIntoView({
      block: 'center',
    });
  }

  addNodeAfter() {
    let node = Node.addAfter(this.container_, this.getSelected());
    this.select(node);
  }

  addNodeBefore() {
    let node = Node.addBefore(this.container_, this.getSelected());
    this.select(node);
  }

  onKeyDown(e) {
    // Keys that work with an empty list
    switch (e.key) {
      case 'n':
        this.addNodeAfter();
        break;

      case 'N':
        this.addNodeBefore();
        break;
    }

    if (!this.container_.firstElementChild) {
      return;
    }

    // Keys that require a current selection
    switch (e.key) {
      case 'd':
        this.deleteSelected();
        break;

      case 'D':
        this.deleteSelectedAndAfter();
        break;

      case 'j':
      case 'ArrowDown':
        this.selectNext();
        break;

      case 'k':
      case 'ArrowUp':
        this.selectPrev();
        break;

      case 'PageUp':
        this.selectPrevPage();
        break;

      case 'PageDown':
        this.selectNextPage();
        break;

      case 'Home':
        this.selectFirst();
        break;

      case 'G': // vi compat
      case 'End':
        this.selectLast();
        break;
    }
  }
}

class Node {
  constructor() {
    this.elem_ = document.createElement('li');
    this.elem_.innerText = 'Node: ';

    let input = document.createElement('input');
    input.type = 'text';
    this.elem_.appendChild(input);

    this.elem_.classList.add('node');

    // TODO: fix reference loop
    this.elem_.xArchObj = this;
  }

  static addBefore(container, elem) {
    let node = new Node();
    container.insertBefore(node.elem_, elem);
    return node.elem_;
  }

  static addAfter(container, elem) {
    let node = new Node();
    container.insertBefore(node.elem_, elem ? elem.nextSibling : null);
    return node.elem_;
  }
}

let editor = new Editor(document.getElementById('definition'));
document.addEventListener('keydown', e => { editor.onKeyDown(e); });
