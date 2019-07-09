class EditorLink extends EditorEntryBase {
  constructor() {
    super();

    this.elem_.innerText = '↓';
    this.elem_.classList.add('link');

    let nodeList = document.createElement('div');
    this.nodes_ = new Editor(nodeList, [Editor.NODE]);
    this.nodes_.setMinEntries(2);
    this.nodes_.setMaxEntries(2);
    this.nodes_.addNodeAfter();
    this.nodes_.addNodeAfter();
    this.elem_.appendChild(nodeList);
  }

  afterDomAdd() {
    this.nodes_.selectNext();
    this.nodes_.getSelected().xArchObj.startEdit();
  }

  serialize() {
    return {
      type: 'link',
      label: this.getLabel(),
      from: this.getFrom().serialize(),
      to: this.getTo().serialize(),
    };
  }

  exportGraphviz() {
    if (this.getFrom().getLabel() == '' || this.getTo().getLabel() == '') {
      return [];
    }

    let label = '';
    if (this.getLabel() != '') {
      label = ' [label="' + this.getLabel() + '"]';
    }

    let ret = [];
    for (let from of this.from) {
      for (let to of this.to) {
        ret.push('"' + from.id + '" -> "' + to.id + '"' + label + ';');
      }
    }

    return ret;
  };

  getFrom() {
    return this.nodes_.getEntries()[0];
  }

  getTo() {
    return this.nodes_.getEntries()[1];
  }

  getLabel() {
    // TODO
    return '';
  }

  setLabel(label) {
    // TODO
    //this.input_.setAttribute('data-arch-value', this.input_.value);
  }

  getElement() {
    return this.elem_;
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
    let link = new EditorLink();
    link.setLabel(ser.label);
    link.nodes_.clear();
    link.nodes_.unserialize([ser.from, ser.to]);
    return link.getElement();
  }
}
