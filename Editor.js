<!--# include file="List.js" -->

class Editor extends List {
  constructor(container, limitsByType) {
    super(container);

    this.limitsByType_ = new Map(limitsByType || [
      [EditorNode,  [0, Number.POSITIVE_INFINITY]],
      [EditorGroup, [0, Number.POSITIVE_INFINITY]],
      [EditorLink,  [0, Number.POSITIVE_INFINITY]],
      [EditorLabel, [0, 1]],
      [EditorHelp,  [0, Number.POSITIVE_INFINITY]],
    ]);

    this.container_.classList.add('editor');
    // Needs to accept focus to receive keydown, but shouldn't be in the normal
    // tab flow.
    this.container_.tabIndex = 99999;
    this.container_.addEventListener('keydown', e => { this.onKeyDown(e); });
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

  addNodeAfter(...rest) {
    if (this.mayAdd(EditorNode)) {
      EditorNode.addAfter(this.container_, this.getSelected(), ...rest);
    }
  }

  addNodeBefore(...rest) {
    if (this.mayAdd(EditorNode)) {
      EditorNode.addBefore(this.container_, this.getSelected(), ...rest);
    }
  }

  addLabelBefore() {
    if (this.mayAdd(EditorLabel)) {
      EditorLabel.addBefore(this.container_, this.getSelected());
    }
  }

  addLabelAfter() {
    if (this.mayAdd(EditorLabel)) {
      EditorLabel.addAfter(this.container_, this.getSelected());
    }
  }

  addLinkAfter() {
    if (this.mayAdd(EditorLink)) {
      EditorLink.addAfter(this.container_, this.getSelected(),
                          this.queryEntries('.highlight', EditorNode));
    }
  }

  addLinkBefore() {
    if (this.mayAdd(EditorLink)) {
      EditorLink.addBefore(this.container_, this.getSelected(),
                           this.queryEntries('.highlight', EditorNode));
    }
  }

  addGroupAfter() {
    if (this.mayAdd(EditorGroup)) {
      EditorGroup.addAfter(this.container_, this.getSelected(),
                           this.queryEntries('.highlight', EditorNode));
    }
  }

  addGroupBefore() {
    if (this.mayAdd(EditorGroup)) {
      EditorGroup.addBefore(this.container_, this.getSelected(),
                            this.queryEntries('.highlight', EditorNode));
    }
  }

  addHelpAfter() {
    if (this.mayAdd(EditorHelp)) {
      EditorHelp.addAfter(this.container_, this.getSelected());
    }
  }
  
  onKeyDown(e) {
    switch (e.key) {
      case 'a':
        this.addLabelAfter();
        e.stopPropagation();
        e.preventDefault();
        return;

      case 'A':
        this.addLabelBefore();
        e.stopPropagation();
        e.preventDefault();
        return;

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

      case 'i':
        this.addLinkAfter();
        e.stopPropagation();
        e.preventDefault();
        return;

      case 'I':
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

      case '?':
        this.addHelpAfter();
        e.stopPropagation();
        e.preventDefault();
        return;

      case 'Escape':
        if (!this.container_.parentElement.xArchObj) {
          for (let entry of this.queryEntries('.highlight')) {
            entry.getElement().classList.toggle('highlight', false);
          }
          this.container_.setAttribute('data-arch-refresh', '');
          e.stopPropagation();
          e.preventDefault();
          return;
        }
    }
    
    super.onKeyDown(e);
  }
}

<!--# include file="EditorEntryBase.js" -->
<!--# include file="EditorGroup.js" -->
<!--# include file="EditorHelp.js" -->
<!--# include file="EditorLabel.js" -->
<!--# include file="EditorLink.js" -->
<!--# include file="EditorNode.js" -->
