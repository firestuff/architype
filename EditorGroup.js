class EditorGroup extends EditorEntryBase {
  constructor(entries) {
    super();

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
    this.nodes_.getSelected().xArchObj.startEdit();
  }

  serialize() {
    return {
      type: 'group',
      id: this.getId(),
      label: this.getLabel(),
      members: this.nodes_.serialize(EditorNode),
      highlight: this.elem_.classList.contains('highlight'),
    };
  }

  getNodes() {
    return this.nodes_.getEntries(EditorNode);
  }

  getLabel() {
    let label = this.nodes_.getEntries(EditorLabel)[0];
    return label ? label.getLabel() : null;
  }

  setLabel(label) {
    let obj = this.nodes_.getEntries(EditorLabel)[0];
    if (obj) {
      obj.setLabel(label);
    } else {
      this.nodes_.addLabelBefore();
      this.setLabel(label);
    }
  }

  setHighlight(highlight) {
    this.elem_.classList.toggle('highlight', highlight);
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

      case ' ':
        this.elem_.classList.toggle('highlight');
        this.elem_.setAttribute('data-arch-refresh', '');
        e.stopPropagation();
        e.preventDefault();
        break;
    }
  }

  static unserialize(ser) {
    let group = new EditorGroup();
    group.nodes_.clear();
    if (ser.label != null) {
      group.setLabel(ser.label);
    }
    group.setHighlight(ser.highlight);
    group.nodes_.unserialize(ser.members);
    return group.getElement();
  }
}
