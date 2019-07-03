class EditorLink extends EditorEntryBase {
  constructor() {
    super();

    this.elem_.innerText = 'Link:';
    this.elem_.classList.add('link');

    this.input_ = document.createElement('input');
    this.input_.type = 'text';
    this.input_.placeholder = 'label';
    this.listen(this.input_, 'keydown', (e) => this.onInputKeyDown(e));
    this.listen(this.input_, 'input', (e) => this.onInput());
    this.listen(this.input_, 'blur', (e) => this.onInput());
    this.elem_.appendChild(this.input_);

    let nodeList = document.createElement('div');
    this.nodes_ = new Editor(nodeList, [Editor.NODE]);
    this.nodes_.setMinEntries(2);
    this.nodes_.setMaxEntries(2);
    this.nodes_.addNodeAfter();
    this.nodes_.addNodeAfter();
    this.elem_.appendChild(nodeList);
  }

  afterDomAdd() {
    this.input_.focus();
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
    return this.input_.value;
  }

  setLabel(label) {
    this.input_.value = label;
    this.onInput();
  }

  getElement() {
    return this.elem_;
  }

  onInput() {
    this.input_.setAttribute('data-arch-value', this.input_.value);
  }

  onInputKeyDown(e) {
    switch (e.key) {
      case 'Enter':
        e.stopPropagation();
        e.preventDefault();
        this.stopEdit();
        {
          let nodes = this.nodes_.getEntries();
          if (nodes[0].getLabel() == '') {
            nodes[0].startEdit();
          } else if (nodes[1].getLabel() == '') {
            nodes[1].startEdit();
          }
        }
        break;

      case 'Escape':
        e.stopPropagation();
        e.preventDefault();
        this.stopEdit();
        break;

      case 'ArrowUp':
      case 'ArrowDown':
      case 'PageUp':
      case 'PageDown':
        this.stopEdit();
        break;

      default:
        e.stopPropagation();
        break;
    }
  }

  onKeyDown(e) {
    super.onKeyDown(e);

    switch (e.key) {
      case 'Enter':
        this.startEdit();
        e.stopPropagation();
        e.preventDefault();
        break;

      case 'ArrowRight':
      case 'l':
        this.nodes_.selectNext();
        break;
    }
  }

  startEdit() {
    this.input_.focus();
  }

  stopEdit() {
    this.elem_.focus();
  }

  static unserialize(ser) {
    let link = new EditorLink();
    link.setLabel(ser.label);
    link.nodes_.clear();
    link.nodes_.unserialize([ser.from, ser.to]);
    return link.getElement();
  }
}
