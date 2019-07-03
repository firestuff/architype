<!--# include file="List.js" -->

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

  clear() {
    this.container_.innerHTML = '';
  }

  serialize() {
    // Doesn't have a type, only used as part of other objects
    let ret = [];
    for (let entry of this.getEntries()) {
      ret.push(entry.serialize());
    }
    return ret;
  }

  unserialize(ser) {
    for (let entry of ser) {
      this.container_.appendChild(EditorEntryBase.unserialize(entry));
    }
  }

  isAllowed(type) {
    return this.mayAdd() && this.allowedTypes_.has(type);
  }

  addNodeAfter() {
    if (this.isAllowed(Editor.NODE)) {
      EditorNode.addAfter(this.container_, this.getSelected());
    }
  }

  addNodeBefore() {
    if (this.isAllowed(Editor.NODE)) {
      EditorNode.addBefore(this.container_, this.getSelected());
    }
  }

  addLinkAfter() {
    if (this.isAllowed(Editor.LINK)) {
      EditorLink.addAfter(this.container_, this.getSelected());
    }
  }

  addLinkBefore() {
    if (this.isAllowed(Editor.LINK)) {
      EditorLink.addBefore(this.container_, this.getSelected());
    }
  }

  addGroupAfter() {
    if (this.isAllowed(Editor.GROUP)) {
      EditorGroup.addAfter(this.container_, this.getSelected());
    }
  }

  addGroupBefore() {
    if (this.isAllowed(Editor.GROUP)) {
      EditorGroup.addBefore(this.container_, this.getSelected());
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
    }
    
    super.onKeyDown(e);
  }
}
