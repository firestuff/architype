class EditorTag extends EditorSublistBase {
  constructor(id, entries) {
    super(id, '#', 'tag', [
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
  }

  serialize() {
    return super.serialize({
      type: 'tag',
      members: this.nodes_.serialize(EditorNode),
    });
  }

  getNodes() {
    return this.nodes_.getEntries(EditorNode);
  }

  static unserialize(ser) {
    let tag = new EditorTag(ser.id);
    tag.nodes_.clear();
    if (ser.label != null) {
      tag.setLabel(ser.label, ser.labelObj.id);
      tag.getLabelObj().setHighlight(ser.labelObj.highlight);
    }
    tag.setHighlight(ser.highlight);
    tag.nodes_.unserialize(ser.members);
    return tag.getElement();
  }
}
