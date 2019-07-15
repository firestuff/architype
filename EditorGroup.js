class EditorGroup extends EditorSublistBase {
  constructor(id, entries) {
    super(id, '□', 'group', [
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
      type: 'group',
      members: this.nodes_.serialize(EditorNode),
    });
  }

  getNodes() {
    return this.nodes_.getEntries(EditorNode);
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
