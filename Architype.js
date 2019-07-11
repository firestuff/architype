'use strict';

addEventListener('error', (e) => {
  console.log(e);
});

class Architype {
  constructor(container) {
    this.container_ = container;

    this.container_.classList.add('architype');
    // TODO: make theme selectable
    this.container_.classList.add('dark');

    document.addEventListener('keydown', (e) => { this.onKeyDown(e); });

    this.editorElem_ = document.createElement('ul');
    this.container_.appendChild(this.editorElem_);
    this.editor_ = new Editor(this.editorElem_);

    this.gridElem_ = document.createElement('div');
    this.container_.appendChild(this.gridElem_);
    this.grid_ = new Grid(this.gridElem_);

    this.generation_ = 0;
    this.renderGeneration_ = -1;
    this.drawGeneration_ = -1;

    this.render_ = [];
    for (let i = 0; i < (navigator.hardwareConcurrency || 2); ++i) {
      let render = new Worker('render.js');
      render.addEventListener('message', (e) => { this.onRender(e); });
      this.render_.push(render);
    }

    addEventListener('hashchange', (e) => { this.onHashChange(e); });

    let fixUrl = false;
    if (location.hash.length > 1) {
      this.unserialize(JSON.parse(atob(location.hash.substring(1))));
    } else {
      this.unserialize(JSON.parse(localStorage.getItem('currentState')));
      fixUrl = true;
    }
    if (this.editor_.getEntries().length == 0) {
      this.editor_.addHelpAfter();
    }
    this.editor_.selectNext();

    this.observer_ = new MutationObserver(e => { this.onChange(e); });
    this.observer2_ = new MutationObserver(e => { this.snapshot(e); });
    this.observe();

    this.saveAndRender();

    if (fixUrl) {
      history.replaceState(null, null, '#' + btoa(this.serializedStr_));
    }
  }

  observe() {
    this.observer_.observe(this.editorElem_, {
      attributes: true,
      attributeFilter: ['data-arch-refresh'],
      childList: true,
      subtree: true,
    });
    this.observer2_.observe(this.editorElem_, {
      attributes: true,
      attributeFilter: ['data-arch-snapshot'],
      childList: true,
      subtree: true,
    });
  }

  unobserve() {
    this.observer_.disconnect();
    this.observer2_.disconnect();
  }

  serialize() {
    return {
      version: 1,
      generation: this.generation_,
      nextId: idSource.peekId(),
      editor: this.editor_.serialize(),
    };
  }

  unserialize(ser) {
    if (!ser) {
      return;
    }

    this.renderGeneration_ = -1;
    this.drawGeneration_ = -1;

    switch (ser.version) {
      case 1:
        this.generation_ = ser.generation;
        idSource.setId(ser.nextId);
        this.editor_.unserialize(ser.editor);
        break;

      default:
        console.log('unrecognized localStorage.currentState version', ser);
        break;
    }
  }

  overwrite(ser) {
    this.unobserve();
    this.editor_.clear();
    this.unserialize(ser);
    this.observe();
    this.editor_.selectNext();
    this.saveAndRender();
  }

  onHashChange() {
    if (location.hash.length > 1) {
      this.overwrite(JSON.parse(atob(location.hash.substring(1))));
    }
  }

  onChange() {
    ++this.generation_;
    this.saveAndRender();
  }

  snapshot() {
    history.pushState(null, null, '#' + btoa(this.serializedStr_));
  }

  saveAndRender() {
    this.serialized_ = this.serialize();
    this.startRender();
    this.serializedStr_ = JSON.stringify(this.serialized_);
    localStorage.setItem('currentState', this.serializedStr_);
  }

  onKeyDown(e) {
    let elem = document.activeElement;
    while (elem) {
      if (elem == this.editorElem_) {
        return;
      }
      elem = elem.parentElement;
    }
    this.editor_.onKeyDown(e);
  }

  onRender(e) {
    this.render_.push(e.target);

    if (e.data.generation > this.drawGeneration_) {
      // Received newer than we've drawn; redraw
      this.drawGeneration_ = e.data.generation;
      this.grid_.draw(e.data.steps);
    }

    this.startRender();
  }

  startRender() {
    if (this.generation_ == this.renderGeneration_) {
      // Already sent this generation for rendering
      return;
    }

    let render = this.render_.pop();
    if (!render) {
      // Ran out of workers
      return;
    }

    this.renderGeneration_ = this.serialized_.generation;
    render.postMessage(this.serialized_);
  }
}

<!--# include file="Editor.js" -->
<!--# include file="Grid.js" -->
<!--# include file="IdSource.js" -->

<!--# include file="utils.js" -->

new Architype(document.getElementById('architype'));
