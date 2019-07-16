<!--# include file="List.js" -->

class Editor extends List {
  constructor(container, limitsByType) {
    super(container);

    this.limitsByType_ = new Map(limitsByType || [
      [EditorNode,  [0, Number.POSITIVE_INFINITY]],
      [EditorGroup, [0, Number.POSITIVE_INFINITY]],
      [EditorLink,  [0, Number.POSITIVE_INFINITY]],
      [EditorTag,   [0, Number.POSITIVE_INFINITY]],
      [EditorLabel, [0, 1]],
      [EditorHelp,  [0, Number.POSITIVE_INFINITY]],
    ]);

    this.container_.classList.add('editor');
    // Needs to accept focus to receive keydown, but shouldn't be in the normal
    // tab flow.
    this.container_.tabIndex = 99999;
    this.container_.addEventListener('keydown', e => { this.onKeyDown(e); });
    this.container_.addEventListener('updateNodesRequest',
                                     e => { this.onUpdateNodesRequest(e); });
    this.container_.focus();
  }

  clear() {
    this.container_.innerHTML = '';
  }

  serialize(type) {
    // Doesn't have a type, only used as part of other objects
    let ret = [];
    for (let entry of this.getEntries(type)) {
      ret.push(entry.serialize());
    }
    return ret;
  }

  unserialize(ser) {
    for (let entry of ser) {
      let elem = EditorEntryBase.unserialize(entry);
      if (elem) {
        this.container_.appendChild(elem);
      } else {
        console.log('failed to unserialize', entry);
      }
    }
  }

  mayAdd(type) {
    let limits = this.limitsByType_.get(type);
    if (!limits) {
      return false;
    }
    return this.getEntries(type).length < limits[1];
  }

  mayDelete(type) {
    let limits = this.limitsByType_.get(type);
    if (!limits) {
      return false;
    }
    return this.getEntries(type).length > limits[0];
  }

  deleteSelected() {
    let highlight = this.queryEntries('.highlight');
    if (highlight.length == 0) {
      return super.deleteSelected();
    }

    for (let obj of highlight) {
      if (this.mayDelete(obj.constructor)) {
        obj.remove();
      }
    }
  }

  addNodeAfter(...rest) {
    if (this.mayAdd(EditorNode)) {
      return EditorNode.addAfter(this.container_, this.getSelected(), ...rest);
    }
    return null;
  }

  addNodeBefore(...rest) {
    if (this.mayAdd(EditorNode)) {
      return EditorNode.addBefore(this.container_, this.getSelected(), ...rest);
    }
    return null;
  }

  addLabelBefore(...rest) {
    if (this.mayAdd(EditorLabel)) {
      return EditorLabel.addBefore(this.container_, this.getSelected(), ...rest);
    }
    return null;
  }

  addLabelAfter(...rest) {
    if (this.mayAdd(EditorLabel)) {
      return EditorLabel.addAfter(this.container_, this.getSelected(), ...rest);
    }
    return null;
  }

  addLinkAfter(...rest) {
    if (this.mayAdd(EditorLink)) {
      return EditorLink.addAfter(
          this.container_, this.getSelected(),
          this.queryEntries('.highlight[data-arch-class="EditorNode"]'),
          ...rest);
    }
    return null;
  }

  addLinkBefore(...rest) {
    if (this.mayAdd(EditorLink)) {
      return EditorLink.addBefore(
          this.container_, this.getSelected(),
          this.queryEntries('.highlight[data-arch-class="EditorNode"]'),
          ...rest);
    }
    return null;
  }

  addGroupAfter(...rest) {
    if (this.mayAdd(EditorGroup)) {
      return EditorGroup.addAfter(
          this.container_, this.getSelected(),
          this.queryEntries('.highlight[data-arch-class="EditorNode"]'),
          ...rest);
    }
    return null;
  }

  addGroupBefore(...rest) {
    if (this.mayAdd(EditorGroup)) {
      return EditorGroup.addBefore(
          this.container_, this.getSelected(),
          this.queryEntries('.highlight[data-arch-class="EditorNode"]'),
          ...rest);
    }
    return null;
  }

  addHelpAfter(...rest) {
    if (this.mayAdd(EditorHelp)) {
      return EditorHelp.addAfter(this.container_, this.getSelected(), ...rest);
    }
    return null;
  }

  addTagAfter(...rest) {
    if (this.mayAdd(EditorTag)) {
      return EditorTag.addAfter(
          this.container_, this.getSelected(),
          this.queryEntries('.highlight[data-arch-class="EditorNode"]'),
          ...rest);
    }
    return null;
  }

  addTagBefore(...rest) {
    if (this.mayAdd(EditorTag)) {
      return EditorTag.addBefore(
          this.container_, this.getSelected(),
          this.queryEntries('.highlight[data-arch-class="EditorNode"]'),
          ...rest);
    }
    return null;
  }

  updateNodes(oldLabel, newLabel) {
    let nodes = this.queryEntries('[data-arch-class="EditorNode"]');
    for (let node of nodes) {
      if (node.getLabel() == oldLabel) {
        node.setLabel(newLabel);
      }
    }
  }

  onUpdateNodesRequest(e) {
    this.updateNodes(e.detail.oldLabel, e.detail.newLabel);
  }
  
  onKeyDown(e) {
    switch (e.key) {
      case 'a':
        if (this.addLabelAfter()) {
          e.stopPropagation();
          e.preventDefault();
        }
        return;

      case 'A':
        if (this.addLabelBefore()) {
          e.stopPropagation();
          e.preventDefault();
        }
        return;

      case 'g':
        if (this.addGroupAfter()) {
          e.stopPropagation();
          e.preventDefault();
        }
        return;
        
      case 'G':
        if (this.addGroupBefore()) {
          e.stopPropagation();
          e.preventDefault();
        }
        return;

      case 'i':
        if (this.addLinkAfter()) {
          e.stopPropagation();
          e.preventDefault();
        }
        return;

      case 'I':
        if (this.addLinkBefore()) {
          e.stopPropagation();
          e.preventDefault();
        }
        return;

      case 'n':
        if (this.addNodeAfter()) {
          e.stopPropagation();
          e.preventDefault();
        }
        return;

      case 'N':
        if (this.addNodeBefore()) {
          e.stopPropagation();
          e.preventDefault();
        }
        return;

      case 't':
      case '#':
        if (this.addTagAfter()) {
          e.stopPropagation();
          e.preventDefault();
        }
        return;

      case 'T':
        if (this.addTagBefore()) {
          e.stopPropagation();
          e.preventDefault();
        }
        return;

      case '?':
        if (this.addHelpAfter()) {
          e.stopPropagation();
          e.preventDefault();
        }
        return;

      case 'Escape':
      case '`':
        if (!this.container_.parentElement.xArchObj) {
          for (let entry of this.queryEntries('.highlight')) {
            entry.setHighlight(false);
          }
          e.stopPropagation();
          e.preventDefault();
          return;
        }
    }
    
    super.onKeyDown(e);
  }
}

<!--# include file="EditorEntryBase.js" -->
<!--# include file="EditorInputBase.js" -->
<!--# include file="EditorSublistBase.js" -->
<!--# include file="EditorGroup.js" -->
<!--# include file="EditorHelp.js" -->
<!--# include file="EditorLabel.js" -->
<!--# include file="EditorLink.js" -->
<!--# include file="EditorNode.js" -->
<!--# include file="EditorTag.js" -->
