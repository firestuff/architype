class EditorLink extends EditorSublistBase {
  constructor(id, entries) {
    super(id, '↓', 'link', [
      [EditorNode,  [2, 2]],
      [EditorLabel, [0, 1]],
    ]);

    this.nodes_.addNodeAfter(
        entries && entries[0] ? entries[0].getLabel() : null);
    this.nodes_.addNodeAfter(
        entries && entries[1] ? entries[1].getLabel() : null);
  }

  serialize() {
    return super.serialize({
      type: 'link',
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
