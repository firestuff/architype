'use strict';

class Editor {
  constructor(container) {
    this.container_ = container;
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

  deleteSelected() {
    let sel = this.getSelected();
    if (sel) {
      let newSel = sel.nextElementSibling || sel.previousElementSibling;
      sel.remove();
      this.select(newSel);
    }
  }

  deleteSelectedAndAfter() {
    let sel = this.getSelected();
    if (sel) {
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

  startEdit() {
    let sel = this.getSelected();
    if (sel) {
      sel.xArchObj.startEdit();
    }
  }

  stopEdit() {
    let sel = this.getSelected();
    if (sel) {
      sel.xArchObj.stopEdit();
    }
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

    switch (e.key) {
      case 'd':
        this.deleteSelected();
        break;

      case 'D':
        this.deleteSelectedAndAfter();
        break;

      case'g':
        this.addGroupAfter();
        e.preventDefault();
        break;

      case'g':
        this.addGroupBefore();
        e.preventDefault();
        break;

      case 'j':
      case 'ArrowDown':
        this.selectNext();
        e.preventDefault();
        break;

      case 'k':
      case 'ArrowUp':
        this.selectPrev();
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

      case 'PageUp':
        this.selectPrevPage();
        e.preventDefault();
        break;

      case 'PageDown':
        this.selectNextPage();
        e.preventDefault();
        break;

      case 'Home':
        this.selectFirst();
        e.preventDefault();
        break;

      case 'End':
        this.selectLast();
        e.preventDefault();
        break;

      case 'Enter':
        this.startEdit();
        e.preventDefault();
        break;
    }
  }
}

class Node {
  constructor() {
    this.elem_ = document.createElement('li');
    this.elem_.innerText = 'Node: ';
    this.elem_.tabIndex = 0;
    this.elem_.addEventListener('focus', () => { this.onElemFocus(); });

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
    this.elem_.focus();
  }

  isEditing() {
    return document.activeElement == this.input_;
  }

  onInputBlur() {
    if (this.input_.value.length == 0) {
      this.elem_.remove();
    }
  }

  onElemFocus() {
    this.elem_.scrollIntoView({block: 'center'});
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
    this.elem_.tabIndex = 0;
    this.elem_.addEventListener('focus', () => { this.onElemFocus(); });

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
    this.elem_.focus();
  }

  isEditing() {
    return document.activeElement == this.input_;
  }

  onInputBlur() {
    if (this.input_.value.length == 0) {
      this.elem_.remove();
    }
  }

  onElemFocus() {
    this.elem_.scrollIntoView({block: 'center'});
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
