'use strict';

class ListenUtils {
  constructor() {
    this.listeners_ = [];
  }

  listen(source, type, callback) {
    source.addEventListener(type, callback);
    this.listeners_.push([source, type, callback]);
  }

  clearListeners() {
    for (let [source, type, callback] of this.listeners_) {
      source.removeEventListener(type, callback);
    }
    this.listeners_ = [];
  }
}

class List {
  constructor(container) {
    this.container_ = container;
  }

  getEntries() {
    let ret = [];
    for (let elem of this.container_.children) {
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

  deleteSelected() {
    let sel = this.getSelected();
    if (sel) {
      sel.xArchObj.remove();
    }
  }

  deleteSelectedAndAfter() {
    let sel = this.getSelected();
    if (sel) {
      while (this.container_.lastElementChild != sel) {
        this.container_.lastElementChild.xArchObj.remove();
      }
      sel.xArchObj.remove();
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

  onKeyDown(e) {
    switch (e.key) {
      case 'Escape':
      case 'ArrowLeft':
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

class NodeList extends List {
  constructor(container) {
    super(container);
    // Needs to accept focus to receive keydown, but shouldn't be in the normal
    // tab flow.
    this.container_.tabIndex = 99999;
    this.container_.addEventListener('keydown', e => { this.onKeyDown(e); });
  }

  addNodeAfter() {
    Node.addAfter(this.container_, this.getSelected());
  }

  addNodeBefore() {
    Node.addBefore(this.container_, this.getSelected());
  }

  onKeyDown(e) {
    switch (e.key) {
      case 'n':
        this.addNodeAfter();
        e.stopPropagation();
        e.preventDefault();
        return;

      case 'N':
        this.addNodeBefore();
        e.stopPropagation();
        e.preventDefault();
        return;
    }

    super.onKeyDown(e);
  }
}

class Editor extends List {
  constructor(container) {
    super(container);
    document.addEventListener('keydown', e => { this.onKeyDown(e); });
  }

  addNodeAfter() {
    Node.addAfter(this.container_, this.getSelected());
  }

  addNodeBefore() {
    Node.addBefore(this.container_, this.getSelected());
  }

  addGroupAfter() {
    Group.addAfter(this.container_, this.getSelected());
  }

  addGroupBefore() {
    Group.addBefore(this.container_, this.getSelected());
  }
  
  onKeyDown(e) {
    switch (e.key) {
      case 'g':
        this.addGroupAfter();
        e.stopPropagation();
        e.preventDefault();
        return;
        
      case 'G':
        this.addGroupBefore();
        e.stopPropagation();
        e.preventDefault();
        return;

      case 'n':
        this.addNodeAfter();
        e.stopPropagation();
        e.preventDefault();
        return;

      case 'N':
        this.addNodeBefore();
        e.stopPropagation();
        e.preventDefault();
        return;
    }
    
    super.onKeyDown(e);
  }
}

class EditorEntryBase extends ListenUtils {
  constructor() {
    super();

    this.elem_ = document.createElement('li');
    this.elem_.tabIndex = 0;
    this.listen(this.elem_, 'focus', () => this.onElemFocus());
    this.listen(this.elem_, 'keydown', (e) => this.onKeyDown(e));

    this.elem_.xArchObj = this;
  }

  remove() {
    if (document.activeElement == this.elem_ ||
        document.activeElement == document.body) {
      if (this.elem_.nextElementSibling) {
        this.elem_.nextElementSibling.focus();
      } else if (this.elem_.previousElementSibling) {
        this.elem_.previousElementSibling.focus();
      }
    }

    this.elem_.remove();
    this.clearListeners();
    this.elem_.xArchObj = null;
  }

  onElemFocus() {
    this.elem_.scrollIntoView({block: 'center'});
  }

  onKeyDown(e) {
  }

  afterDomAdd() {
  }

  static addBefore(container, elem) {
    let entry = new this();
    container.insertBefore(entry.elem_, elem);
    entry.afterDomAdd();
    return entry.elem_;
  }

  static addAfter(container, elem) {
    let entry = new this();
    container.insertBefore(entry.elem_, elem ? elem.nextSibling : null);
    entry.afterDomAdd();
    return entry.elem_;
  }
}

class Node extends EditorEntryBase {
  constructor() {
    super();

    this.elem_.innerText = 'Node: ';
    this.elem_.classList.add('node');

    this.input_ = document.createElement('input');
    this.input_.type = 'text';
    this.input_.placeholder = 'node name';
    this.listen(this.input_, 'keydown', (e) => this.onInputKeyDown(e));
    this.listen(this.input_, 'blur', () => this.onInputBlur());
    this.elem_.appendChild(this.input_);
  }

  afterDomAdd() {
    this.input_.focus();
  }

  onInputKeyDown(e) {
    switch (e.key) {
      case 'Enter':
      case 'Escape':
        e.stopPropagation();
        e.preventDefault();
        this.stopEdit();
        break;

      case 'ArrowUp':
      case 'ArrowDown':
      case 'PageUp':
      case 'PageDown':
        this.stopEdit();
        break;

      case 'ArrowLeft':
        e.stopPropagation();
        if (this.input_.selectionEnd == 0) {
          e.preventDefault();
          this.stopEdit();
        }
        break;

      default:
        e.stopPropagation();
        break;
    }
  }

  onKeyDown(e) {
    super.onKeyDown(e);

    switch (e.key) {
      case 'Enter':
        this.startEdit();
        e.stopPropagation();
        e.preventDefault();
        break;

      case 'ArrowRight':
        this.startEdit();
        this.input_.selectionEnd = 0;
        e.stopPropagation();
        e.preventDefault();
        break;
    }
  }

  startEdit() {
    this.input_.focus();
  }

  stopEdit() {
    this.elem_.focus();
  }

  onInputBlur() {
    if (this.input_.value.length == 0 && (this.elem_.previousElementSibling ||
                                          this.elem_.nextElementSibling)) {
      this.remove();
    }
  }

  getValue() {
    return this.input_.value;
  }
}

class Group extends EditorEntryBase {
  constructor() {
    super();

    this.elem_.innerText = 'Group: ';
    this.elem_.classList.add('group');

    this.input_ = document.createElement('input');
    this.input_.type = 'text';
    this.input_.placeholder = 'group name';
    this.listen(this.input_, 'keydown', (e) => this.onInputKeyDown(e));
    this.listen(this.input_, 'blur', () => this.onInputBlur());
    this.elem_.appendChild(this.input_);

    let nodeList = document.createElement('div');
    nodeList.classList.add('nodelist');
    this.nodes_ = new NodeList(nodeList);
    this.nodes_.addNodeAfter();
    this.elem_.appendChild(nodeList);
  }

  afterDomAdd() {
    this.input_.focus();
  }

  onInputKeyDown(e) {
    switch (e.key) {
      case 'Enter':
        e.stopPropagation();
        e.preventDefault();
        this.stopEdit();
        {
          let nodes = this.nodes_.getEntries();
          if (nodes.length == 1 && nodes[0].getValue() == '') {
            nodes[0].startEdit();
          }
        }
        break;

      case 'Escape':
        e.stopPropagation();
        e.preventDefault();
        this.stopEdit();
        break;

      case 'ArrowUp':
      case 'ArrowDown':
      case 'PageUp':
      case 'PageDown':
        this.stopEdit();
        break;

      default:
        e.stopPropagation();
        break;
    }
  }

  onKeyDown(e) {
    super.onKeyDown(e);

    switch (e.key) {
      case 'Enter':
        this.startEdit();
        e.stopPropagation();
        e.preventDefault();
        break;

      case 'ArrowRight':
        this.nodes_.selectNext();
        break;
    }
  }

  startEdit() {
    this.input_.focus();
  }

  stopEdit() {
    this.elem_.focus();
  }

  onInputBlur() {
    if (this.input_.value.length == 0) {
      this.remove();
    }
  }
}

new Editor(document.getElementById('definition'));
