class EditorGroup extends EditorEntryBase {
  constructor(id, entries) {
    super(id);

    this.elem_.innerText = '□';
    this.elem_.classList.add('group');

    let nodeList = document.createElement('div');
    this.nodes_ = new Editor(nodeList, [
      [EditorNode,  [1, Number.POSITIVE_INFINITY]],
      [EditorLabel, [0, 1]],
    ]);
    if (entries && entries.length) {
      for (let entry of entries) {
        this.nodes_.addNodeAfter(entry.getLabel());
      }
    } else {
      this.nodes_.addNodeAfter();
    }
    this.elem_.appendChild(nodeList);
  }

  afterDomAdd() {
    this.nodes_.selectNext();
    let node = this.nodes_.getSelected().xArchObj;
    if (node.getLabel() == '') {
      node.startEdit();
    }
  }

  serialize() {
    return super.serialize({
      type: 'group',
      label: this.getLabel(),
      labelObj: this.getLabelObj().serialize(),
      members: this.nodes_.serialize(EditorNode),
    });
  }

  getNodes() {
    return this.nodes_.getEntries(EditorNode);
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

  static unserialize(ser) {
    let group = new EditorGroup(ser.id);
    group.nodes_.clear();
    if (ser.label != null) {
      group.setLabel(ser.label, ser.labelObj.id);
      group.getLabelObj().setHighlight(ser.labelObj.highlight);
    }
    group.setHighlight(ser.highlight);
    group.nodes_.unserialize(ser.members);
    return group.getElement();
  }
}
