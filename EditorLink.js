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

  serialize() {
    return {
      type: 'link',
      id: this.getId(),
      label: this.getLabel(),
      from: this.getFrom().serialize(),
      to: this.getTo().serialize(),
      highlight: this.elem_.classList.contains('highlight'),
    };
  }

  getFrom() {
    return this.nodes_.getEntries(EditorNode)[0];
  }

  getTo() {
    return this.nodes_.getEntries(EditorNode)[1];
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

      case ' ':
        this.elem_.classList.toggle('highlight');
        this.elem_.setAttribute('data-arch-refresh', '');
        this.elem_.setAttribute('data-arch-snapshot', '');
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
      link.setLabel(ser.label);
    }
    link.setHighlight(ser.highlight);
    link.nodes_.unserialize([ser.from, ser.to]);
    return link.getElement();
  }
}
