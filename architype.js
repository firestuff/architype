'use strict';

class Architype {
  constructor(container) {
    this.container_ = container;

    this.container_.classList.add('architype');
    // TODO: make theme selectable
    this.container_.classList.add('google');

    let editorElem = document.createElement('ul');
    this.container_.appendChild(editorElem);
    this.editor_ = new Editor(editorElem);

    this.targets_ = document.createElement('datalist');
    this.targets_.id = 'arch-targets';
    this.container_.appendChild(this.targets_);

    this.observer_ = new MutationObserver(e => { this.onEdit(e); });
    this.observer_.observe(editorElem, {
      attributes: true,
      attributeFilter: ['data-arch-value'],
      childList: true,
      subtree: true,
    });
  }

  onEdit(e) {
    this.graph_ = this.buildGraph();
    console.log(this.graph_);
    this.updateTargets();
  }

  updateTargets() {
    // Lots of effort to avoid churning the datalist

    let curTargets = new Map();
    for (let option of this.targets_.options) {
      curTargets.set(option.value, option);
    }

    for (let [label, entries] of this.graph_.targetsByLabel.entries()) {
      if (curTargets.has(label)) {
        continue;
      }
      if (entries.length == 1 &&
          document.activeElement.parentElement.xArchObj &&
          document.activeElement.parentElement.xArchObj == entries[0]) {
        // Skip an element currently being edited
        continue;
      }
      let option = document.createElement('option');
      option.value = label;
      this.targets_.appendChild(option);
    }

    for (let [label, option] of curTargets.entries()) {
      if (this.graph_.targetsByLabel.has(label)) {
        continue;
      }
      option.remove();
    }
  }

  buildGraph() {
    let graph = {
      targetsByLabel: new Map(),
      groups: [],
    };
    this.buildGraphInt(graph, this.editor_.getEntries());
    this.trimSoftNodes(graph);
    return graph;
  }

  buildGraphInt(graph, entries) {
    for (let entry of entries) {
      if (entry instanceof Node) {
        this.buildGraphNode(graph, entry);
      } else if (entry instanceof Group) {
        this.buildGraphGroup(graph, entry);
      } else if (entry instanceof Link) {
        this.buildGraphLink(graph, entry);
      }
    }
  }

  buildGraphTarget(graph, label, target) {
    if (label == '') {
      return;
    }
    let targets = graph.targetsByLabel.get(label) || [];
    targets.push(target);
    graph.targetsByLabel.set(label, targets);
  }

  buildGraphNode(graph, node) {
    node.clear();
    this.buildGraphTarget(graph, node.getLabel(), node);
  }

  buildGraphGroup(graph, group) {
    group.clear();
    graph.groups.push(group);
    this.buildGraphTarget(graph, group.getLabel(), group);
    this.buildGraphInt(graph, group.getNodes());
  }

  buildGraphLink(graph, link) {
    link.clear();
    this.buildGraphTarget(graph, link.getLabel(), link);
    this.buildGraphInt(graph, [link.getFrom(), link.getTo()]);
    // TODO: record link information on source node
  }

  trimSoftNodes(graph) {
    for (let entries of graph.targetsByLabel.values()) {
      for (let i = entries.length - 1; i >= 0 && entries.length > 1; --i) {
        if (entries[i] instanceof Node && entries[i].isSoft()) {
          entries.splice(i, 1);
        }
      }
    }
  }
}

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
    this.minEntries_ = 0;
    this.maxEntries_ = Number.MAX_SAFE_INTEGER;
  }

  setMinEntries(min) {
    this.minEntries_ = min;
  }

  setMaxEntries(max) {
    this.maxEntries_ = max;
  }

  getEntries() {
    let ret = [];
    for (let elem of this.container_.children) {
      ret.push(elem.xArchObj);
    }
    return ret;
  }

  mayAdd() {
    return this.container_.children.length < this.maxEntries_;
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
    if (this.container_.children.length <= this.minEntries_) {
      return;
    }
    let sel = this.getSelected();
    if (sel) {
      sel.xArchObj.remove();
    }
  }

  deleteSelectedAndAfter() {
    let sel = this.getSelected();
    if (sel) {
      while (this.container_.lastElementChild != sel &&
             this.container_.children.length > this.minEntries_) {
        this.container_.lastElementChild.xArchObj.remove();
      }
      this.deleteSelected();
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

class Editor extends List {
  static NODE = 1;
  static GROUP = 2;
  static LINK = 3;

  constructor(container, allowedTypes) {
    super(container);

    this.allowedTypes_ = new Set(allowedTypes ||
                                 [Editor.NODE, Editor.GROUP, Editor.LINK]);

    this.container_.classList.add('editor');
    // Needs to accept focus to receive keydown, but shouldn't be in the normal
    // tab flow.
    this.container_.tabIndex = 99999;
    this.container_.addEventListener('keydown', e => { this.onKeyDown(e); });
    this.container_.focus();
  }

  isAllowed(type) {
    return this.mayAdd() && this.allowedTypes_.has(type);
  }

  addNodeAfter() {
    if (this.isAllowed(Editor.NODE)) {
      Node.addAfter(this.container_, this.getSelected());
    }
  }

  addNodeBefore() {
    if (this.isAllowed(Editor.NODE)) {
      Node.addBefore(this.container_, this.getSelected());
    }
  }

  addLinkAfter() {
    if (this.isAllowed(Editor.LINK)) {
      Link.addAfter(this.container_, this.getSelected());
    }
  }

  addLinkBefore() {
    if (this.isAllowed(Editor.LINK)) {
      Link.addBefore(this.container_, this.getSelected());
    }
  }

  addGroupAfter() {
    if (this.isAllowed(Editor.GROUP)) {
      Group.addAfter(this.container_, this.getSelected());
    }
  }

  addGroupBefore() {
    if (this.isAllowed(Editor.GROUP)) {
      Group.addBefore(this.container_, this.getSelected());
    }
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

      case 'l':
        this.addLinkAfter();
        e.stopPropagation();
        e.preventDefault();
        return;

      case 'L':
        this.addLinkBefore();
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
      } else if (this.elem_.parentElement) {
        this.elem_.parentElement.focus();
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

    this.elem_.innerText = 'Node:  ';
    this.elem_.classList.add('node');

    this.input_ = document.createElement('input');
    this.input_.type = 'text';
    this.input_.placeholder = 'node name';
    this.input_.setAttribute('list', 'arch-targets');
    this.listen(this.input_, 'keydown', (e) => this.onInputKeyDown(e));
    this.listen(this.input_, 'input', (e) => this.onInput());
    this.listen(this.input_, 'blur', (e) => this.onInput());
    this.elem_.appendChild(this.input_);
  }

  afterDomAdd() {
    this.input_.focus();
  }

  clear() {
    this.elem_.classList.remove('error');
  }

  setError() {
    this.elem_.classList.add('error');
  }

  getLabel() {
    return this.input_.value;
  }

  isSoft() {
    // Nested nodes are presumed to be references to other nodes if they exist
    let iter = this.elem_.parentElement;
    for (let iter = this.elem_.parentElement; iter; iter = iter.parentElement) {
      if (iter.xArchObj) {
        return true;
      }
    }
    return false;
  }

  onInput() {
    this.input_.setAttribute('data-arch-value', this.input_.value);
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
    }
  }

  startEdit() {
    this.input_.focus();
  }

  stopEdit() {
    if (this.elem_.nextElementSibling &&
        this.elem_.nextElementSibling.xArchObj &&
        this.elem_.nextElementSibling.xArchObj.getLabel() == '') {
      this.elem_.nextElementSibling.xArchObj.startEdit();
    } else {
      this.elem_.focus();
    }
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
    this.listen(this.input_, 'input', (e) => this.onInput());
    this.listen(this.input_, 'blur', (e) => this.onInput());
    this.elem_.appendChild(this.input_);

    let nodeList = document.createElement('div');
    this.nodes_ = new Editor(nodeList, [Editor.NODE]);
    this.nodes_.setMinEntries(1);
    this.nodes_.addNodeAfter();
    this.elem_.appendChild(nodeList);
  }

  afterDomAdd() {
    this.input_.focus();
  }

  clear() {
    this.elem_.classList.remove('error');
  }

  setError() {
    this.elem_.classList.add('error');
  }

  getNodes() {
    return this.nodes_.getEntries();
  }

  getLabel() {
    return this.input_.value;
  }

  onInputKeyDown(e) {
    switch (e.key) {
      case 'Enter':
        e.stopPropagation();
        e.preventDefault();
        this.stopEdit();
        {
          let nodes = this.nodes_.getEntries();
          if (nodes.length == 1 && nodes[0].getLabel() == '') {
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

  onInput() {
    this.input_.setAttribute('data-arch-value', this.input_.value);
  }

  startEdit() {
    this.input_.focus();
  }

  stopEdit() {
    this.elem_.focus();
  }
}

class Link extends EditorEntryBase {
  constructor() {
    super();

    this.elem_.innerText = 'Link:  ';
    this.elem_.classList.add('link');

    this.input_ = document.createElement('input');
    this.input_.type = 'text';
    this.input_.placeholder = 'label';
    this.listen(this.input_, 'keydown', (e) => this.onInputKeyDown(e));
    this.listen(this.input_, 'input', (e) => this.onInput());
    this.listen(this.input_, 'blur', (e) => this.onInput());
    this.elem_.appendChild(this.input_);

    let nodeList = document.createElement('div');
    this.nodes_ = new Editor(nodeList, [Editor.NODE]);
    this.nodes_.setMinEntries(2);
    this.nodes_.setMaxEntries(2);
    this.nodes_.addNodeAfter();
    this.nodes_.addNodeAfter();
    this.elem_.appendChild(nodeList);
  }

  afterDomAdd() {
    this.input_.focus();
  }

  clear() {
    this.elem_.classList.remove('error');
  }

  setError() {
    this.elem_.classList.add('error');
  }

  getFrom() {
    return this.nodes_.getEntries()[0];
  }

  getTo() {
    return this.nodes_.getEntries()[1];
  }

  getLabel() {
    return this.input_.value;
  }

  onInput() {
    this.input_.setAttribute('data-arch-value', this.input_.value);
  }

  onInputKeyDown(e) {
    switch (e.key) {
      case 'Enter':
        e.stopPropagation();
        e.preventDefault();
        this.stopEdit();
        {
          let nodes = this.nodes_.getEntries();
          if (nodes[0].getLabel() == '') {
            nodes[0].startEdit();
          } else if (nodes[1].getLabel() == '') {
            nodes[1].startEdit();
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
}

new Architype(document.getElementById('architype'));
