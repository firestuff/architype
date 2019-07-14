class EditorSublistBase extends EditorEntryBase {
  constructor(id, icon, cls, limits) {
    super(id);

    this.elem_.innerText = icon;
    this.elem_.classList.add(cls);

    let nodeList = document.createElement('div');
    this.nodes_ = new Editor(nodeList, limits);
    this.elem_.appendChild(nodeList);
  }

  afterDomAdd() {
    this.nodes_.selectNext();
    let node = this.nodes_.getSelected().xArchObj;
    if (node.getLabel() == '') {
      node.startEdit();
    }
  }

  serialize(base) {
    super.serialize(base);
    base.label = this.getLabel();
    base.labelObj = this.getLabelObj() ? this.getLabelObj().serialize() : null;
    return base;
  }

  getLabel() {
    let label = this.getLabelObj();
    return label ? label.getLabel() : null;
  }

  setLabel(label, labelId) {
    let obj = this.nodes_.getEntries(EditorLabel)[0];
    if (obj) {
      obj.setLabel(label);
    } else {
      this.nodes_.addLabelBefore(labelId);
      this.setLabel(label);
    }
  }

  getLabelObj() {
    return this.nodes_.getEntries(EditorLabel)[0];
  }

  onKeyDown(e) {
    super.onKeyDown(e);

    switch (e.key) {
      case 'Enter':
      case 'ArrowRight':
      case 'l':
        this.nodes_.selectNext();
        e.stopPropagation();
        e.preventDefault();
        break;
    }
  }
}
