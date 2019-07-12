class EditorHelp extends EditorEntryBase {
  constructor(id) {
    super(id);

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
    this.addKey('?');
    this.addText('Help            ');

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

    this.addLine();
    this.addKey('u');
    this.addText('Undo            ');

    this.addLine();
    this.addKey('⇧');
    this.addText('+');
    this.addKey('u');
    this.addText('Redo      ');

    this.addLine();
    this.addKey('m');
    this.addText('Next theme      ');

    this.addLine();

    this.addLine();
    this.addLink(
        'GitHub',
        'https://github.com/firestuff/architype/blob/master/README.md');
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

  addLink(text, href) {
    let a = document.createElement('a');
    a.href = href;
    a.innerText = text;
    this.line_.appendChild(a);
  }

  afterDomAdd() {
    this.elem_.focus();
  }

  serialize() {
    return {
      type: 'help',
      id: this.getId(),
    };
  }

  static unserialize(ser) {
    return (new EditorHelp(ser.id)).getElement();
  }
}

