class EditorLink extends EditorEntryBase {
  constructor(id, entries) {
    super(id);

    this.elem_.innerText = '↓';
    this.elem_.classList.add('link');

    let nodeList = document.createElement('div');
    this.nodes_ = new Editor(nodeList, [
      [EditorNode,  [2, 2]],
      [EditorLabel, [0, 1]],
    ]);
    this.nodes_.addNodeAfter(
        entries && entries[0] ? entries[0].getLabel() : null);
    this.nodes_.addNodeAfter(
        entries && entries[1] ? entries[1].getLabel() : null);
    this.elem_.appendChild(nodeList);
  }

  afterDomAdd() {
    this.nodes_.selectNext();
    let node = this.nodes_.getSelected().xArchObj;
    if (node.getLabel() == '') {
      node.startEdit();
    }
  }

  // TODO: factor out common base code with EditorGroup
  serialize() {
    return super.serialize({
      type: 'link',
      label: this.getLabel(),
      labelObj: this.getLabelObj() ? this.getLabelObj().serialize() : null,
      from: this.getFrom().serialize(),
      to: this.getTo().serialize(),
    });
  }

  getFrom() {
    return this.nodes_.getEntries(EditorNode)[0];
  }

  getTo() {
    return this.nodes_.getEntries(EditorNode)[1];
  }

  getLabel() {
    let label = this.getLabelObj();
    return label ? label.getLabel() : null;
  }

  setLabel(label, labelId) {
    let obj = this.getLabelObj();
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

  flip() {
    let entries = this.nodes_.getEntries(EditorNode);
    let fromElem = entries[0].getElement();
    let toElem = entries[1].getElement();
    let fromHasFocus = document.activeElement == fromElem;
    let toHasFocus = document.activeElement == toElem;

    toElem.parentElement.insertBefore(toElem, fromElem);

    if (fromHasFocus) {
      fromElem.focus();
    } else if (toHasFocus) {
      toElem.focus();
    }
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

      case 'f':
        this.flip();
        e.stopPropagation();
        e.preventDefault();
        break;
    }
  }

  static unserialize(ser) {
    let link = new EditorLink(ser.id);
    link.nodes_.clear();
    if (ser.label != null) {
      link.setLabel(ser.label, ser.labelObj.id);
      link.getLabelObj().setHighlight(ser.labelObj.highlight);
    }
    link.setHighlight(ser.highlight);
    link.nodes_.unserialize([ser.from, ser.to]);
    return link.getElement();
  }
}
