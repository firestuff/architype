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

  startEdit() {
    this.getSelected().xArchObj.startEdit();
  }

  stopEdit() {
    this.getSelected().xArchObj.stopEdit();
  }

  isEditing() {
    let sel = this.getSelected();
    return sel && sel.xArchObj.isEditing();
  }

  addNodeAfter() {
    let node = Node.addAfter(this.container_, this.getSelected());
    this.select(node);
    this.startEdit();
  }

  addNodeBefore() {
    let node = Node.addBefore(this.container_, this.getSelected());
    this.select(node);
    this.startEdit();
  }

  addGroupAfter() {
    let group = Group.addAfter(this.container_, this.getSelected());
    this.select(group);
    this.startEdit();
  }

  addGroupBefore() {
    let group = Group.addBefore(this.container_, this.getSelected());
    this.select(group);
    this.startEdit();
  }

  onKeyDown(e) {
    if (this.isEditing()) {
      switch (e.key) {
        case 'Enter':
        case 'Escape':
          this.stopEdit();
          // Do not allow other actions below to run
          return;

        case 'ArrowUp':
        case 'ArrowDown':
        case 'PageUp':
        case 'PageDown':
          this.stopEdit();
          // Allow other actions below to run
          break;

        default:
          // Most keystrokes just go into the input field
          return;
      }
    }

    // Keys that work with an empty list
    switch (e.key) {
      case'g':
        this.addGroupAfter();
        e.preventDefault();
        break;

      case'g':
        this.addGroupBefore();
        e.preventDefault();
        break;

      case 'n':
        this.addNodeAfter();
        e.preventDefault();
        break;

      case 'N':
        this.addNodeBefore();
        e.preventDefault();
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

      case 'End':
        this.selectLast();
        break;

      case 'Enter':
        this.startEdit();
        break;
    }
  }
}

class Node {
  constructor() {
    this.elem_ = document.createElement('li');
    this.elem_.innerText = 'Node: ';

    this.input_ = document.createElement('input');
    this.input_.type = 'text';
    this.input_.placeholder = 'node name';
    this.input_.addEventListener('blur', () => { this.onInputBlur(); });
    this.elem_.appendChild(this.input_);

    this.elem_.classList.add('node');

    // TODO: fix reference loop
    this.elem_.xArchObj = this;
  }

  startEdit() {
    this.input_.focus();
  }

  stopEdit() {
    this.input_.blur();
  }

  isEditing() {
    return document.activeElement == this.input_;
  }

  onInputBlur() {
    if (this.input_.value.length == 0) {
      this.elem_.remove();
    }
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

class Group {
  constructor() {
    this.elem_ = document.createElement('li');
    this.elem_.innerText = 'Group: ';

    this.input_ = document.createElement('input');
    this.input_.type = 'text';
    this.input_.placeholder = 'group name';
    this.input_.addEventListener('blur', () => { this.onInputBlur(); });
    this.elem_.appendChild(this.input_);

    this.elem_.classList.add('group');

    // TODO: fix reference loop
    this.elem_.xArchObj = this;

  }

  startEdit() {
    this.input_.focus();
  }

  stopEdit() {
    this.input_.blur();
  }

  isEditing() {
    return document.activeElement == this.input_;
  }

  onInputBlur() {
    if (this.input_.value.length == 0) {
      this.elem_.remove();
    }
  }

  static addBefore(container, elem) {
    let group = new Group();
    container.insertBefore(group.elem_, elem);
    return group.elem_;
  }

  static addAfter(container, elem) {
    let group = new Group();
    container.insertBefore(group.elem_, elem ? elem.nextSibling : null);
    return group.elem_;
  }
}

let editor = new Editor(document.getElementById('definition'));
document.addEventListener('keydown', e => { editor.onKeyDown(e); });
