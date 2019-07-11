class EditorHelp extends EditorEntryBase {
  constructor() {
    super();

    this.elem_.classList.add('help');

    this.addLine();
    this.addText('Navigation');

    this.addLine();
    this.addKey('←', '↓', '↑', '→');

    this.addLine();
    this.addKey('h', 'j', 'k', 'l');

    this.addLine();
    this.addKey('␛', '',  '',  '⏎');

    this.addLine();

    this.addLine();
    this.addKey('n');
    this.addText('Node  ');
    this.addKey('g');
    this.addText('Group');

    this.addLine();
    this.addKey('i');
    this.addText('Link  ');
    this.addKey('a');
    this.addText('Label');

    this.addLine();
    this.addKey('⇧');
    this.addText('+');
    this.addKey('n');
    this.addText('Node above');

    this.addLine();
    this.addKey('d');
    this.addText('Delete          ');

    this.addLine();
    this.addKey('⇧');
    this.addText('+');
    this.addKey('d');
    this.addText('Del after ');

    this.addLine();
    this.addKey('␣');
    this.addText('Highlight       ');

    this.addLine();
    this.addKey('f');
    this.addText('Flip link       ');
  }

  addLine() {
    this.line_ = document.createElement('div');
    this.elem_.appendChild(this.line_);
  }

  addText(text) {
    let elem = document.createElement('span');
    elem.classList.add('text');
    elem.innerText = text;
    this.line_.appendChild(elem);
  }

  addKey(...symbols) {
    for (let symbol of symbols) {
      let key = document.createElement('div');
      key.classList.add('key');
      key.innerText = symbol;
      this.line_.appendChild(key);
    }
  }

  afterDomAdd() {
    this.elem_.focus();
  }

  serialize() {
    return {
      type: 'help',
    };
  }

  static unserialize(ser) {
    return (new EditorHelp()).getElement();
  }
}

